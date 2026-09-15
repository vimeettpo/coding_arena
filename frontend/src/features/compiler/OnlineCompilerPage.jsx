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

  const [selectedLang, setSelectedLang] = useState(COMPILER_LANGUAGES[0]); // default C
  const [code, setCode] = useState(COMPILER_LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null); // { verdict, text, runtimeMs }
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
        text: data.output || data.stderr || 'Program executed with no output.',
        runtimeMs: data.runtimeMs || 0,
      });
    } catch (err) {
      setOutput({
        verdict: 'RUNTIME_ERROR',
        text: err.response?.data?.message || err.message || 'Execution error.',
        runtimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 96px)', display: 'flex', gap: 2, p: 0.5 }}>
      {/* Left Icon Sidebar for Language Selection */}
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
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        {COMPILER_LANGUAGES.map((lang) => {
          const isSelected = selectedLang.id === lang.id;
          return (
            <Tooltip key={lang.id} title={`${lang.name} Compiler`} placement="right" arrow>
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
                  bgcolor: isSelected ? 'rgba(245, 158, 11, 0.15)' : '#F8FAFC',
                  color: isSelected ? '#D97706' : '#64748B',
                  border: isSelected ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 2px 6px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? 'rgba(245, 158, 11, 0.2)' : '#F1F5F9',
                    color: isSelected ? '#D97706' : '#0F172A',
                    borderColor: isSelected ? '#F59E0B' : '#CBD5E1',
                  },
                }}
              >
                {lang.badge}
              </Box>
            </Tooltip>
          );
        })}
      </Paper>

      {/* Main Container: Editor (Left) & Console (Right) */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, minWidth: 0 }}>
        {/* Editor Panel */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Header Bar */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FAFAFA' }}
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
                  bgcolor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                {selectedLang.name} Online Compiler
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Decrease font size">
                <IconButton size="small" onClick={() => dispatch(setFontSize(Math.max(11, fontSize - 1)))} sx={{ color: '#64748B' }}>
                  <TextDecreaseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Increase font size">
                <IconButton size="small" onClick={() => dispatch(setFontSize(Math.min(22, fontSize + 1)))} sx={{ color: '#64748B' }}>
                  <TextIncreaseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Toggle theme">
                <IconButton size="small" onClick={() => dispatch(toggleTheme())} sx={{ color: '#64748B' }}>
                  {monacoTheme === 'ca-dark' ? (
                    <DarkModeRoundedIcon fontSize="small" />
                  ) : (
                    <LightModeRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
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

        {/* Output & Input Panel */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', md: '42%' },
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Header Bar */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FAFAFA' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Execution Output
            </Typography>
            <Tooltip title="Clear output">
              <IconButton size="small" onClick={() => setOutput(null)} sx={{ color: '#64748B' }}>
                <DeleteSweepRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Output Display Area */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflow: 'auto',
              bgcolor: monacoTheme === 'ca-dark' ? '#0F172A' : '#F8FAFC',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.84rem',
              color: monacoTheme === 'ca-dark' ? '#F8FAFC' : '#0F172A',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {isRunning && (
              <Typography variant="body2" sx={{ color: '#D97706', fontWeight: 600 }}>
                Compiling and running {selectedLang.name} program…
              </Typography>
            )}
            {!isRunning && output && (
              <Stack spacing={1}>
                {output.verdict === 'COMPILATION_ERROR' && (
                  <Chip
                    label="Compilation Error"
                    size="small"
                    sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontWeight: 700, width: 'fit-content' }}
                  />
                )}
                {output.verdict === 'RUNTIME_ERROR' && (
                  <Chip
                    label="Runtime Error"
                    size="small"
                    sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA', fontWeight: 700, width: 'fit-content' }}
                  />
                )}
                {output.verdict === 'SUCCESS' && (
                  <Chip
                    label="Execution Success"
                    size="small"
                    sx={{ bgcolor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', fontWeight: 700, width: 'fit-content' }}
                  />
                )}
                <Box
                  component="div"
                  sx={{
                    lineHeight: 1.6,
                    p: 1.5,
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 1.5,
                  }}
                >
                  {output.text}
                </Box>

                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                  Execution time: {output.runtimeMs} ms
                </Typography>
              </Stack>
            )}
            {!isRunning && !output && (
              <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                Click <strong>Run</strong> to compile and execute your code. Standard output and errors will appear here.
              </Typography>
            )}
          </Box>

          {/* Stdin / Custom Input Section */}
          <Box sx={{ borderTop: '1px solid #E2E8F0', p: 1.75, bgcolor: '#FAFAFA' }}>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, mb: 0.75, display: 'block' }}>
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
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 1.5,
                p: 1.25,
                outline: 'none',
                color: '#0F172A',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8125rem',
                '&:focus': {
                  borderColor: '#F59E0B',
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default OnlineCompilerPage;
