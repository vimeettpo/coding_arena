import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Divider,
  useMediaQuery,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import Logo from '@/components/common/Logo';
import CollegeLogo from '@/components/common/CollegeLogo';
import { NAV_BY_ROLE } from './navConfig';
import { useAppDispatch, useAuth } from '@/app/hooks';
import { logout } from '@/features/auth/authSlice';

const DRAWER_WIDTH = 248;

const ROLE_LABEL = { STUDENT: 'Student', TRAINER: 'Trainer', ADMIN: 'Admin' };

const DashboardLayout = () => {
  const { user, role } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const navItems = NAV_BY_ROLE[role] || [];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <Logo size="sm" />
      </Box>
      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === `/${(role || '').toLowerCase()}`}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'text.secondary',
              fontWeight: 500,
              transition: 'all 0.15s ease',
              '&.active': {
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                color: '#D97706',
                fontWeight: 600,
                '& .MuiListItemIcon-root': { color: '#D97706' },
              },
              '&:hover': { bgcolor: '#F8FAFC', color: 'text.primary' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 'inherit' }}
              primary={item.label}
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Chip
          size="small"
          label={`${ROLE_LABEL[role] || 'User'} account`}
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            width: '100%',
            bgcolor: '#F1F5F9',
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            fontWeight: 500,
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            sx={{ display: { md: 'none' }, color: 'text.primary' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, mr: 1 }}>
            <CollegeLogo height={26} />
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ height: 28, alignSelf: 'center', display: { xs: 'none', md: 'block' } }}
          />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Account menu">
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'rgba(124, 92, 255, 0.12)',
                color: 'secondary.main',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: '1px solid rgba(124, 92, 255, 0.25)',
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: 2.5,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                minWidth: 200,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>{user?.name || 'Account'}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontSize: '0.88rem' }}>
              <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} /> Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: '#FFFFFF',
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          px: { xs: 2, md: 4 },
          pt: { xs: 10, md: 12 },
          pb: 6,
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
