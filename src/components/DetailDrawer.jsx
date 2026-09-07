import React from 'react';
import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Generic right-hand detail drawer. Every "click a row/card to see more"
 * interaction across the dashboard (KPIs, competencies, states, divisions)
 * shares this shell instead of each page defining its own drawer chrome.
 */
export default function DetailDrawer({ open, onClose, eyebrow, title, children }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 420 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 3, pb: 2 }}>
          <Box>
            {eyebrow && (
              <Typography variant="overline" color="text.secondary">
                {eyebrow}
              </Typography>
            )}
            <Typography variant="h6" sx={{ mt: 0.25 }}>
              {title}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>{children}</Box>
      </Box>
    </Drawer>
  );
}
