import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  InputAdornment,
} from '@mui/material';
import DomainRoundedIcon from '@mui/icons-material/DomainRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import adminService from '@/services/adminService';

const DEFAULT_GOOGLE_DOMAINS = ['gmail.com', 'googlemail.com'];

const AdminSettingsPage = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getDomains();
      setDomains(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load allowed domains.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e) => {
    e.preventDefault();
    const cleaned = newDomain.toLowerCase().trim().replace(/^@+/, '');

    if (!cleaned) {
      setError('Please enter a valid domain name (e.g. vimeet.ac.in).');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await adminService.addDomain(cleaned);
      setNewDomain('');
      setSuccess(`Domain "@${cleaned}" added to whitelist successfully.`);
      await fetchDomains();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add domain.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDomain = async (id, domainName) => {
    try {
      setError('');
      setSuccess('');
      await adminService.removeDomain(id);
      setSuccess(`Domain "@${domainName}" removed from whitelist.`);
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove domain.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 5 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Platform Settings & Access Control
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
          Configure institutional registration policies, allowed email domains, and platform security.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Domain Whitelisting */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(245, 158, 11, 0.12)',
                  color: '#D97706',
                  display: 'flex',
                }}
              >
                <DomainRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Allowed Registration Email Domains
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Only students and trainers with email addresses from these domains can create accounts.
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Add Domain Form */}
            <Box component="form" onSubmit={handleAddDomain} sx={{ mb: 3.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155', mb: 1 }}>
                Add New Institution / Allowed Domain
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. vimeet.ac.in or college.edu"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>@</Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: '#F8FAFC' }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !newDomain.trim()}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />}
                  sx={{
                    bgcolor: '#F59E0B',
                    '&:hover': { bgcolor: '#D97706' },
                    color: '#FFFFFF',
                    fontWeight: 600,
                    px: 3,
                    whiteSpace: 'nowrap',
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                >
                  Add Domain
                </Button>
              </Stack>
            </Box>

            {/* Whitelisted Domains List */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155', mb: 1.5 }}>
              Currently Whitelisted Domains ({domains.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: '#F59E0B' }} />
              </Box>
            ) : domains.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                No domains currently listed. Only default Google domains will be accepted.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {domains.map((item) => {
                  const isGoogle = DEFAULT_GOOGLE_DOMAINS.includes(item.domain.toLowerCase());
                  return (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        p: 1.75,
                        px: 2.25,
                        borderRadius: 2,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
                          @{item.domain}
                        </Typography>
                        {isGoogle ? (
                          <Chip
                            size="small"
                            label="Google Official"
                            sx={{
                              bgcolor: 'rgba(2, 132, 199, 0.1)',
                              color: '#0284C7',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Institution"
                            sx={{
                              bgcolor: 'rgba(16, 185, 129, 0.1)',
                              color: '#10B981',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                      </Stack>

                      <IconButton
                        size="small"
                        aria-label={`Remove domain ${item.domain}`}
                        onClick={() => handleRemoveDomain(item.id, item.domain)}
                        sx={{
                          color: '#94A3B8',
                          '&:hover': { color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.08)' },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Security Information */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <SecurityRoundedIcon sx={{ color: '#10B981' }} />
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                Access Policy Rules
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.25 }}>
                  Registration Gate
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  Every new registration must match one of the verified domains listed here. Unapproved domains are immediately blocked at the API gateway.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.25 }}>
                  Official Google Domains
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  Gmail (@gmail.com) and Googlemail are whitelisted by default to support students without institution-issued email handles.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.25 }}>
                  Institutional Domains
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  Add your college or university domain suffix (e.g. <code>vimeet.ac.in</code>) to seamlessly permit student and trainer onboardings.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSettingsPage;
