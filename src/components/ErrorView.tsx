import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

type ErrorViewProps = {
  message: string;
};

export function ErrorView({ message }: ErrorViewProps) {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={2}
      borderStyle="double"
      borderColor="red"
    >
      <Text {...theme.error}>{'✖ Error'}</Text>
      <Text {...theme.errorBorder}>{message}</Text>
    </Box>
  );
}
