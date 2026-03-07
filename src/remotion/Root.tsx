import React from 'react'
import { Composition } from 'remotion'
import {
  defaultStockNewsShortProps,
  StockNewsShortComposition
} from './StockNewsShortComposition'

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id='StockNewsShort'
      component={StockNewsShortComposition}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={300}
      defaultProps={defaultStockNewsShortProps}
    />
  )
}
