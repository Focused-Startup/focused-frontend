import { ComponentType } from 'react';
import type { SwipeableProps } from 'react-native-gesture-handler';
import { Swipeable as DefaultSwipeable } from 'react-native-gesture-handler';

type SwipeableComponentType = ComponentType<SwipeableProps>;

let CompatSwipeable: SwipeableComponentType = DefaultSwipeable as SwipeableComponentType;

try {
  const reanimatedModule = require('react-native-gesture-handler/ReanimatedSwipeable');
  if (reanimatedModule?.default) {
    CompatSwipeable = reanimatedModule.default as SwipeableComponentType;
  }
} catch {
  CompatSwipeable = DefaultSwipeable as SwipeableComponentType;
}

export default CompatSwipeable;
