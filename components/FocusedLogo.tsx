import React from "react";
import Svg, { Defs, LinearGradient, Stop, Text } from "react-native-svg";

const FocusedLogo = () => (
  <Svg width={300} height={50} viewBox="0 0 300 50">
    <Defs>
      <LinearGradient id="focusedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#4facfe" stopOpacity="1" />
        <Stop offset="100%" stopColor="#9b59b6" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Text
      x="30%"
      y="50%"
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
