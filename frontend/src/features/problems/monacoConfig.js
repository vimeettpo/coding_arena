// Registered once when the editor mounts. Keeps Monaco's palette in sync
// with the app's design tokens instead of using Monaco's stock vs-dark.
export const defineMonacoThemes = (monaco) => {
  monaco.editor.defineTheme('ca-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '56637A', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FFB020' },
      { token: 'string', foreground: '34D399' },
      { token: 'number', foreground: '7C5CFF' },
      { token: 'type', foreground: '38BDF8' },
    ],
    colors: {
      'editor.background': '#121822',
      'editor.foreground': '#E8EDF4',
      'editorLineNumber.foreground': '#3A465A',
      'editorLineNumber.activeForeground': '#FFB020',
      'editor.selectionBackground': '#7C5CFF33',
      'editorCursor.foreground': '#FFB020',
      'editor.lineHighlightBackground': '#1A223055',
      'editorGutter.background': '#121822',
    },
  });

  monaco.editor.defineTheme('ca-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7C3AED', fontStyle: 'bold' },
      { token: 'string', foreground: '059669' },
      { token: 'number', foreground: '0284C7' },
      { token: 'type', foreground: '2563EB' },
      { token: 'identifier', foreground: '0F172A' },
      { token: 'delimiter', foreground: '334155' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#0F172A',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#D97706',
      'editor.selectionBackground': '#FEF3C7',
      'editorCursor.foreground': '#D97706',
      'editor.lineHighlightBackground': '#F8FAFC',
      'editorGutter.background': '#FAFAFA',
    },
  });
};

export const LANGUAGE_BOILERPLATE = {
  java: `class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  python: `def solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  javascript: `function solve() {\n  // Write your solution here\n}\n\nsolve();\n`,
};

export const MONACO_LANGUAGE_ID = {
  java: 'java',
  python: 'python',
  cpp: 'cpp',
  c: 'c',
  javascript: 'javascript',
};
