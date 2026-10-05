import { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Button,
  Tooltip,
  Chip,
} from '@mui/material';

import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import TextDecreaseRoundedIcon from '@mui/icons-material/TextDecreaseRounded';
import TextIncreaseRoundedIcon from '@mui/icons-material/TextIncreaseRounded';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleTheme, setFontSize } from '@/features/editor/editorSlice';
import { defineMonacoThemes } from '@/features/problems/monacoConfig';
import problemService from '@/services/problemService';

const COMPILER_LANGUAGES = [
  {
    id: 'c',
    name: 'C',
    filename: 'main.c',
    monacoLang: 'c',
    badge: 'C',
    color: '#00599C',
    defaultCode: `// Online C Compiler to run C program online
#include <stdio.h>

int main() {
    // Write C code here
    printf("Start small. Ship something.\\n");

    return 0;
}`,
  },
  {
    id: 'cpp',
    name: 'C++',
    filename: 'main.cpp',
    monacoLang: 'cpp',
    badge: 'C++',
    color: '#00599C',
    defaultCode: `// Online C++ Compiler to run C++ program online
#include <iostream>
using namespace std;

int main() {
    // Write C++ code here
    cout << "Start small. Ship something." << endl;

    return 0;
}`,
  },
  {
    id: 'java',
    name: 'Java',
    filename: 'Main.java',
    monacoLang: 'java',
    badge: 'JAVA',
    color: '#ED8B00',
    defaultCode: `// Online Java Compiler to run Java program online
public class Main {
    public static void main(String[] args) {
        // Write Java code here
        System.out.println("Start small. Ship something.");
    }
}`,
  },
  {
    id: 'python',
    name: 'Python',
    filename: 'main.py',
    monacoLang: 'python',
    badge: 'PY',
    color: '#3776AB',
    defaultCode: `# Online Python Compiler to run Python program online
# Write Python code here
print("Start small. Ship something.")
`,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    filename: 'script.js',
    monacoLang: 'javascript',
    badge: 'JS',
    color: '#F7DF1E',
    defaultCode: `// Online JavaScript Compiler to run JS program online
// Write JavaScript code here
console.log("Start small. Ship something.");
`,
  },
  {
    id: 'go',
    name: 'Go',
    filename: 'main.go',
    monacoLang: 'go',
    badge: 'GO',
    color: '#00ADD8',
    defaultCode: `// Online Go Compiler to run Go program online
package main
import "fmt"

func main() {
    // Write Go code here
    fmt.Println("Start small. Ship something.")
}`,
  },
  {
    id: 'rust',
    name: 'Rust',
    filename: 'main.rs',
    monacoLang: 'rust',
    badge: 'RS',
    color: '#CE412B',
    defaultCode: `// Online Rust Compiler to run Rust program online
fn main() {
    // Write Rust code here
    println!("Start small. Ship something.");
}`,
  },
];

const OnlineCompilerPage = () => {
  const dispatch = useAppDispatch();
  const { monacoTheme, fontSize } = useAppSelector((s) => s.editor);

  const isDarkMode = monacoTheme === 'ca-dark';

  /*
   * Theme colors
   * These are used throughout the compiler page so that
   * the UI changes together with the Monaco editor.
   */
  const theme = {
    pageBackground: isDarkMode ? '#0B1120' : '#FFFFFF',

    panelBackground: isDarkMode ? '#111827' : '#FFFFFF',
    headerBackground: isDarkMode ? '#172033' : '#FAFAFA',
    secondaryBackground: isDarkMode ? '#0F172A' : '#F8FAFC',

    outputBackground: isDarkMode ? '#0B1220' : '#F8FAFC',
    outputBoxBackground: isDarkMode ? '#1E293B' : '#FFFFFF',

    inputBackground: isDarkMode ? '#1E293B' : '#FFFFFF',

    border: isDarkMode ? '#334155' : '#E2E8F0',
    borderStrong: isDarkMode ? '#475569' : '#CBD5E1',

    primaryText: isDarkMode ? '#F8FAFC' : '#0F172A',
    secondaryText: isDarkMode ? '#CBD5E1' : '#475569',
    mutedText: isDarkMode ? '#94A3B8' : '#64748B',

    iconColor: isDarkMode ? '#CBD5E1' : '#64748B',

    languageBackground: isDarkMode ? '#1E293B' : '#F8FAFC',
    languageText: isDarkMode ? '#CBD5E1' : '#64748B',

    hoverBackground: isDarkMode ? '#334155' : '#F1F5F9',

    outputText: isDarkMode ? '#F8FAFC' : '#0F172A',
    placeholder: isDarkMode ? '#64748B' : '#94A3B8',

    successBackground: isDarkMode ? '#14532D' : '#DCFCE7',
    successText: isDarkMode ? '#86EFAC' : '#15803D',
    successBorder: isDarkMode ? '#166534' : '#BBF7D0',

    errorBackground: isDarkMode ? '#450A0A' : '#FEE2E2',
    errorText: isDarkMode ? '#FCA5A5' : '#B91C1C',
    errorBorder: isDarkMode ? '#7F1D1D' : '#FECACA',

    accent: '#F59E0B',
  };

  const [selectedLang, setSelectedLang] = useState(COMPILER_LANGUAGES[0]);
  const [code, setCode] = useState(COMPILER_LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageSelect = (langObj) => {
    setSelectedLang(langObj);
    setCode(langObj.defaultCode);
    setOutput(null);
  };

  const handleRun = async () => {
    setIsRunning(true);

    try {
      const res = await problemService.compile({
        language: selectedLang.id,
        code,
        stdin,
      });

      const data = res.data || res;

      setOutput({
        verdict: data.verdict || 'SUCCESS',
        text:
          data.output ||
          data.stdout ||
          data.stderr ||
          'Program executed with no output.',
        runtimeMs: data.runtimeMs || 0,
      });
    } catch (err) {
      setOutput({
        verdict: 'RUNTIME_ERROR',
        text:
          err.response?.data?.message ||
          err.message ||
          'Execution error.',
        runtimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 96px)',
        display: 'flex',
        gap: 2,
        p: 0.5,
        bgcolor: theme.pageBackground,
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* =========================================================
          LEFT LANGUAGE SIDEBAR
      ========================================================= */}
      <Paper
        elevation={0}
        sx={{
          width: 68,
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          gap: 1.5,
          bgcolor: theme.panelBackground,
          border: `1px solid ${theme.border}`,
          transition: 'all 0.2s ease',
        }}
      >
        {COMPILER_LANGUAGES.map((lang) => {
          const isSelected = selectedLang.id === lang.id;

          return (
            <Tooltip
              key={lang.id}
              title={`${lang.name} Compiler`}
              placement="right"
              arrow
            >
              <Box
                onClick={() => handleLanguageSelect(lang)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  fontFamily: "'JetBrains Mono', monospace",

                  bgcolor: isSelected
                    ? 'rgba(245, 158, 11, 0.15)'
                    : theme.languageBackground,

                  color: isSelected
                    ? '#D97706'
                    : theme.languageText,

                  border: isSelected
                    ? '1.5px solid #F59E0B'
                    : `1px solid ${theme.border}`,

                  boxShadow: isSelected
                    ? '0 2px 6px rgba(245, 158, 11, 0.2)'
                    : 'none',

                  transition: 'all 0.15s ease',

                  '&:hover': {
                    bgcolor: isSelected
                      ? 'rgba(245, 158, 11, 0.2)'
                      : theme.hoverBackground,

                    color: isSelected
                      ? '#D97706'
                      : theme.primaryText,

                    borderColor: isSelected
                      ? '#F59E0B'
                      : theme.borderStrong,
                  },
                }}
              >
                {lang.badge}
              </Box>
            </Tooltip>
          );
        })}
      </Paper>

      {/* =========================================================
          MAIN CONTAINER
      ========================================================= */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          gap: 2,
          minWidth: 0,
        }}
      >
        {/* =======================================================
            EDITOR PANEL
        ======================================================= */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: theme.panelBackground,
            border: `1px solid ${theme.border}`,
            transition: 'all 0.2s ease',
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.2,
              borderBottom: `1px solid ${theme.border}`,
              bgcolor: theme.headerBackground,
              transition: 'all 0.2s ease',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip
                label={selectedLang.filename}
                size="small"
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 1.5,
                  bgcolor: theme.panelBackground,
                  color: theme.primaryText,
                  border: `1px solid ${theme.border}`,
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  color: theme.secondaryText,
                  fontWeight: 500,
                }}
              >
                {selectedLang.name} Online Compiler
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {/* Decrease Font */}
              <Tooltip title="Decrease font size">
                <IconButton
                  size="small"
                  onClick={() =>
                    dispatch(setFontSize(Math.max(11, fontSize - 1)))
                  }
                  sx={{
                    color: theme.iconColor,
                    '&:hover': {
                      bgcolor: theme.hoverBackground,
                    },
                  }}
                >
                  <TextDecreaseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Increase Font */}
              <Tooltip title="Increase font size">
                <IconButton
                  size="small"
                  onClick={() =>
                    dispatch(setFontSize(Math.min(22, fontSize + 1)))
                  }
                  sx={{
                    color: theme.iconColor,
                    '&:hover': {
                      bgcolor: theme.hoverBackground,
                    },
                  }}
                >
                  <TextIncreaseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip title="Toggle theme">
                <IconButton
                  size="small"
                  onClick={() => dispatch(toggleTheme())}
                  sx={{
                    color: theme.iconColor,
                    '&:hover': {
                      bgcolor: theme.hoverBackground,
                    },
                  }}
                >
                  {isDarkMode ? (
                    <DarkModeRoundedIcon fontSize="small" />
                  ) : (
                    <LightModeRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>

              {/* Run */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowRoundedIcon />}
                onClick={handleRun}
                disabled={isRunning}
                sx={{
                  px: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                }}
              >
                {isRunning ? 'Running…' : 'Run'}
              </Button>
            </Stack>
          </Stack>

          {/* Monaco Editor */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={selectedLang.monacoLang}
              theme={monacoTheme}
              value={code}
              onChange={(val) => setCode(val ?? '')}
              beforeMount={defineMonacoThemes}
              options={{
                fontSize,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
              }}
            />
          </Box>
        </Paper>

        {/* =======================================================
            OUTPUT + INPUT PANEL
        ======================================================= */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '42%' },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: theme.panelBackground,
            border: `1px solid ${theme.border}`,
            transition: 'all 0.2s ease',
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.2,
              borderBottom: `1px solid ${theme.border}`,
              bgcolor: theme.headerBackground,
              transition: 'all 0.2s ease',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: theme.primaryText,
              }}
            >
              Execution Output
            </Typography>

            <Tooltip title="Clear output">
              <IconButton
                size="small"
                onClick={() => setOutput(null)}
                sx={{
                  color: theme.iconColor,
                  '&:hover': {
                    bgcolor: theme.hoverBackground,
                  },
                }}
              >
                <DeleteSweepRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* =====================================================
              OUTPUT DISPLAY
          ===================================================== */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflow: 'auto',

              // IMPORTANT: Theme-aware output background
              bgcolor: theme.outputBackground,

              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.84rem',

              // IMPORTANT: Theme-aware default text
              color: theme.outputText,

              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              transition: 'all 0.2s ease',
            }}
          >
            {isRunning && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.accent,
                  fontWeight: 600,
                }}
              >
                Compiling and running {selectedLang.name} program…
              </Typography>
            )}

            {!isRunning && output && (
              <Stack spacing={1}>
                {/* Compilation Error */}
                {output.verdict === 'COMPILATION_ERROR' && (
                  <Chip
                    label="Compilation Error"
                    size="small"
                    sx={{
                      bgcolor: theme.errorBackground,
                      color: theme.errorText,
                      border: `1px solid ${theme.errorBorder}`,
                      fontWeight: 700,
                      width: 'fit-content',
                    }}
                  />
                )}

                {/* Runtime Error */}
                {output.verdict === 'RUNTIME_ERROR' && (
                  <Chip
                    label="Runtime Error"
                    size="small"
                    sx={{
                      bgcolor: theme.errorBackground,
                      color: theme.errorText,
                      border: `1px solid ${theme.errorBorder}`,
                      fontWeight: 700,
                      width: 'fit-content',
                    }}
                  />
                )}

                {/* Success */}
                {output.verdict === 'SUCCESS' && (
                  <Chip
                    label="Execution Success"
                    size="small"
                    sx={{
                      bgcolor: theme.successBackground,
                      color: theme.successText,
                      border: `1px solid ${theme.successBorder}`,
                      fontWeight: 700,
                      width: 'fit-content',
                    }}
                  />
                )}

                {/* =================================================
                    ACTUAL OUTPUT BOX
                ================================================= */}
                <Box
                  component="div"
                  sx={{
                    lineHeight: 1.6,
                    p: 1.5,

                    // IMPORTANT FIX:
                    // Previously this was always #FFFFFF.
                    bgcolor: theme.outputBoxBackground,

                    border: `1px solid ${theme.border}`,
                    borderRadius: 1.5,

                    // IMPORTANT FIX:
                    // Explicit output text color.
                    color: theme.outputText,

                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',

                    transition: 'all 0.2s ease',
                  }}
                >
                  {output.text}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: theme.mutedText,
                    fontWeight: 500,
                  }}
                >
                  Execution time: {output.runtimeMs} ms
                </Typography>
              </Stack>
            )}

            {!isRunning && !output && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.mutedText,
                  fontStyle: 'italic',
                }}
              >
                Click <strong>Run</strong> to compile and execute your code.
                Standard output and errors will appear here.
              </Typography>
            )}
          </Box>

          {/* =====================================================
              STANDARD INPUT
          ===================================================== */}
          <Box
            sx={{
              borderTop: `1px solid ${theme.border}`,
              p: 1.75,
              bgcolor: theme.headerBackground,
              transition: 'all 0.2s ease',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.secondaryText,
                fontWeight: 700,
                mb: 0.75,
                display: 'block',
              }}
            >
              Standard Input (stdin):
            </Typography>

            <Box
              component="textarea"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Provide input for scanf / cin / input() / Scanner here…"
              sx={{
                width: '100%',
                height: 72,
                resize: 'none',

                // IMPORTANT: Theme-aware input background
                bgcolor: theme.inputBackground,

                border: `1px solid ${theme.border}`,
                borderRadius: 1.5,
                p: 1.25,
                outline: 'none',

                // IMPORTANT: Theme-aware input text
                color: theme.primaryText,

                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8125rem',

                '&::placeholder': {
                  color: theme.placeholder,
                  opacity: 1,
                },

                '&:focus': {
                  borderColor: theme.accent,
                },

                transition: 'all 0.2s ease',
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default OnlineCompilerPage;