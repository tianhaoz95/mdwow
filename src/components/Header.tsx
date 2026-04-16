import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import type { InkTheme } from '../themes.js';

type HeaderProps = {
  filename: string;
  isLive: boolean;
  lastUpdated: Date | null;
  inkTheme: InkTheme;
};

export function Header({ filename, isLive, lastUpdated, inkTheme: t }: HeaderProps) {
  const [flash, setFlash] = useState(false);
  const [prevUpdated, setPrevUpdated] = useState(lastUpdated);

  useEffect(() => {
    if (lastUpdated !== prevUpdated && lastUpdated !== null) {
      setFlash(true);
      setPrevUpdated(lastUpdated);
      const timer = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, prevUpdated]);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const liveStyle = flash ? t.liveIndicatorUpdating : t.liveIndicator;

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      borderStyle="single"
      borderColor={t.borderColor}
    >
      <Box gap={1}>
        <Text {...t.appName} backgroundColor={t.headerBg}>
          {' mdwow '}
        </Text>
        <Text dimColor>·</Text>
        <Text {...t.header}>{filename}</Text>
      </Box>
      <Box gap={1}>
        {isLive && <Text {...liveStyle}>{'⬤ live'}</Text>}
        <Text dimColor>{timeStr}</Text>
      </Box>
    </Box>
  );
}
