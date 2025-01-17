/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { DocumentDataModel, ICommand, ICommandInfo } from '@univerjs/core';
import { CommandType, ICommandService, IUniverInstanceService, JSONX, TextX, TextXActionType } from '@univerjs/core';
import type { ITextRangeWithStyle } from '@univerjs/engine-render';

import { getRetainAndDeleteFromReplace } from '../../basics/retain-delete-params';
import { IMEInputManagerService } from '../../services/ime-input-manager.service';
import type { IRichTextEditingMutationParams } from '../mutations/core-editing.mutation';
import { RichTextEditingMutation } from '../mutations/core-editing.mutation';
import { getInsertSelection } from '../../basics/selection';

export interface IIMEInputCommandParams {
    unitId: string;
    newText: string;
    oldTextLen: number;
    isCompositionStart: boolean;
    isCompositionEnd: boolean;
}

export const IMEInputCommand: ICommand<IIMEInputCommandParams> = {
    id: 'doc.command.ime-input',

    type: CommandType.COMMAND,

    // eslint-disable-next-line max-lines-per-function
    handler: async (accessor, params: IIMEInputCommandParams) => {
        const { unitId, newText, oldTextLen, isCompositionEnd, isCompositionStart } = params;
        // console.log('===ime', params);
        const commandService = accessor.get(ICommandService);
        const imeInputManagerService = accessor.get(IMEInputManagerService);
        const previousActiveRange = imeInputManagerService.getActiveRange();
        const univerInstanceService = accessor.get(IUniverInstanceService);
        const doc = univerInstanceService.getUnit<DocumentDataModel>(unitId);
        const body = doc?.getBody();
        if (!previousActiveRange || !body) {
            return false;
        }
        const insertRange = getInsertSelection(previousActiveRange, body);
        Object.assign(previousActiveRange, insertRange);

        const { startOffset, style, segmentId } = previousActiveRange;
        const len = newText.length;

        const textRanges: ITextRangeWithStyle[] = [
            {
                startOffset: startOffset + len,
                endOffset: startOffset + len,
                collapsed: true,
                style,
            },
        ];

        const doMutation: ICommandInfo<IRichTextEditingMutationParams> = {
            id: RichTextEditingMutation.id,
            params: {
                unitId,
                actions: [],
                textRanges,
            },
        };

        const textX = new TextX();
        const jsonX = JSONX.getInstance();

        let memoryCursor = 0;
        if (!previousActiveRange.collapsed && isCompositionStart) {
            const { dos, retain, cursor } = getRetainAndDeleteFromReplace(previousActiveRange, segmentId, 0, body);
            textX.push(...dos);
            doMutation.params!.textRanges = [{
                startOffset: startOffset + len + retain,
                endOffset: startOffset + len + retain,
                collapsed: true,
            }];
            memoryCursor = cursor;
        } else {
            textX.push({
                t: TextXActionType.RETAIN,
                len: startOffset,
                segmentId,
            });
            memoryCursor = startOffset;
        }

        if (oldTextLen > 0) {
            textX.push({
                t: TextXActionType.DELETE,
                len: oldTextLen,
                line: 0,
                segmentId,
            });
        }

        textX.push({
            t: TextXActionType.INSERT,
            body: {
                dataStream: newText,
            },
            len: newText.length,
            line: 0,
            segmentId,
        });

        doMutation.params!.actions = jsonX.editOp(textX.serialize());

        doMutation.params!.noHistory = !isCompositionEnd;

        doMutation.params!.isCompositionEnd = isCompositionEnd;

        const result = commandService.syncExecuteCommand<
            IRichTextEditingMutationParams,
            IRichTextEditingMutationParams
        >(doMutation.id, doMutation.params);

        imeInputManagerService.pushUndoRedoMutationParams(result, doMutation.params!);

        return Boolean(result);
    },
};
