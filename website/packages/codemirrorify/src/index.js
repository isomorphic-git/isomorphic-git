import { EditorView } from "@codemirror/next/view";
import { EditorState } from "@codemirror/next/state";
import { lineNumbers } from "@codemirror/next/gutter";
import { specialChars } from "@codemirror/next/special-chars";
import {
  history,
  redo,
  redoSelection,
  undo,
  undoSelection
} from "@codemirror/next/history";
import { foldCode, unfoldCode, foldGutter } from "@codemirror/next/fold";
import { javascript } from "@codemirror/next/lang-javascript";
import { defaultHighlighter } from "@codemirror/next/highlight";
import { baseKeymap, indentSelection } from "@codemirror/next/commands";
import { bracketMatching } from "@codemirror/next/matchbrackets";
import { closeBrackets } from "@codemirror/next/closebrackets";
import { keymap } from "@codemirror/next/keymap";
import { autocomplete } from "@codemirror/next/autocomplete";

export function codemirrorify (doc) {
  let isMac = /Mac/.test(navigator.platform);
  let myView = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        specialChars(),
        history(),
        foldGutter(),
        javascript(),
        // linter(esLint(new Linter())),
        defaultHighlighter,
        bracketMatching(),
        closeBrackets,
        autocomplete({
          completeAt(state, pos) {
            return new Promise(resolve => {
              const line = state.doc.lineAt(pos);
              const before = state.doc.slice(line.start, pos);
              const after = state.doc.slice(pos, line.end);
              // Do not auto-complete in the middle of words
              if (after.length > 0 && after[0].match(/\w/)) {
                return resolve({ items: [] });
              }
              // get prefix
              const matches = before.match(/\W(\w+)$/);
              if (!matches) return resolve({ items: [] });
              const prefix = matches[1];
              const start = pos - prefix.length;

              // FIXME nvda in einer VM ausprobieren
              let items = [
                "git",
                "add",
                "addNote",
                "addRemote",
                "annotatedTag",
                "branch",
                "checkout",
                "clone",
                "commit",
                "currentBranch",
                "deleteBranch",
                "deleteRef",
                "deleteRemote",
                "deleteTag",
                "expandOid",
                "expandRef",
                "fetch",
                "findMergeBase",
                "findRoot",
                "getConfig",
                "getConfigAll",
                "getRemoteInfo",
                "hashBlob",
                "indexPack",
                "init",
                "isDescendent",
                "listBranches",
                "listFiles",
                "listNotes",
                "listRemotes",
                "listTags",
                "log",
                "merge",
                "packObjects",
                "pull",
                "push",
                "readBlob",
                "readCommit",
                "readNote",
                "readObject",
                "readTag",
                "readTree",
                "remove",
                "removeNote",
                "resetIndex",
                "resolveRef",
                "setConfig",
                "status",
                "statusMatrix",
                "tag",
                "verify",
                "version",
                "walk",
                "writeBlob",
                "writeCommit",
                "writeObject",
                "writeRef",
                "writeTag",
                "writeTree"
              ]
                .filter(s => s.startsWith(prefix) && s !== prefix)
                .map(s => ({ label: s, insertText: s }));
              setTimeout(() => resolve({ start: start, items }), 100);
            });
          }
        }),
        keymap({
          "Mod-z": undo,
          "Mod-Shift-z": redo,
          "Mod-u": view => undoSelection(view) || true,
          [isMac ? "Mod-Shift-u" : "Alt-u"]: redoSelection,
          "Ctrl-y": isMac ? undefined : redo,
          "Shift-Tab": indentSelection,
          "Mod-Alt-[": foldCode,
          "Mod-Alt-]": unfoldCode,
          // "Shift-Mod-m": openLintPanel
        }),
        keymap(baseKeymap)
      ]
    })
  });
  return myView.dom;
}
