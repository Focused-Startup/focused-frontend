import React from "react";
import Svg, { Defs, LinearGradient, Stop, Text } from "react-native-svg";

export type FocusedLogoProps = {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

const FocusedLogo = ({width = 300, height = 50, x = 30, y = 70}: FocusedLogoProps) => (
  <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    <Defs>
      <LinearGradient id="focusedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#4facfe" stopOpacity="1" />
        <Stop offset="100%" stopColor="#9b59b6" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Text
      x={`${x}%`}
      y={`${y}%`}
      textAnchor="middle"
      fontFamily="Quicksand"
      fontSize="32"
      fontWeight="bold"
      fill="url(#focusedGradient)"
    >
      Focused
    </Text>
  </Svg>
);

export default FocusedLogo;
