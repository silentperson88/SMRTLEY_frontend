import React from 'react'
import { Composition } from 'remotion'
import {
  defaultStockNewsShortProps,
  StockNewsShortComposition
} from './StockNewsShortComposition'
import { defaultSceneStoryProps, SceneStoryComposition } from './SceneStoryComposition'
import {
  defaultNewsScriptHighlightsProps,
  NewsScriptHighlightsComposition
} from './NewsScriptHighlightsComposition'
import {
  defaultNewsApproachOneProps,
  NewsApproachOneComposition
} from './NewsApproachOneComposition'
import {
  defaultNewsApproachSequenceProps,
  NewsApproachSequenceComposition
} from './NewsApproachSequenceComposition'
import {
  defaultShortScriptAudioPreviewProps,
  ShortScriptAudioPreviewComposition
} from './ShortScriptAudioPreviewComposition'
import {
  defaultSocialTemplateOneProps,
  SocialTemplateOneComposition
} from './SocialTemplateOneComposition'
import {
  defaultSocialTemplateTwoProps,
  SocialTemplateTwoComposition
} from './SocialTemplateTwoComposition'
import {
  defaultSocialTemplateTwoOverlayProps,
  SocialTemplateTwoOverlayComposition
} from './SocialTemplateTwoOverlayComposition'
import {
  defaultSocialTemplateThreeHeaderProps,
  SocialTemplateThreeHeaderComposition
} from './SocialTemplateThreeHeaderComposition'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id='StockNewsShort'
        component={StockNewsShortComposition}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={300}
        defaultProps={defaultStockNewsShortProps}
      />
      <Composition
        id='SceneStoryVideo'
        component={SceneStoryComposition}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={18000}
        defaultProps={defaultSceneStoryProps}
      />
      <Composition
        id='NewsScriptHighlights'
        component={NewsScriptHighlightsComposition}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={18000}
        defaultProps={defaultNewsScriptHighlightsProps}
      />
      <Composition
        id='NewsApproachOneVideo'
        component={NewsApproachOneComposition}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={18000}
        defaultProps={defaultNewsApproachOneProps}
      />
      <Composition
        id='NewsApproachSequenceVideo'
        component={NewsApproachSequenceComposition}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={18000}
        defaultProps={defaultNewsApproachSequenceProps}
      />
      <Composition
        id='NewsContentVideoLandscape'
        component={ShortScriptAudioPreviewComposition}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={18000}
        defaultProps={defaultShortScriptAudioPreviewProps}
      />
      <Composition
        id='NewsContentVideoLandscape720'
        component={ShortScriptAudioPreviewComposition}
        width={1280}
        height={720}
        fps={24}
        durationInFrames={18000}
        defaultProps={defaultShortScriptAudioPreviewProps}
      />
      <Composition
        id='NewsContentVideoShort'
        component={ShortScriptAudioPreviewComposition}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={18000}
        defaultProps={defaultShortScriptAudioPreviewProps}
      />
      <Composition
        id='NewsContentVideoShort720'
        component={ShortScriptAudioPreviewComposition}
        width={720}
        height={1280}
        fps={24}
        durationInFrames={18000}
        defaultProps={defaultShortScriptAudioPreviewProps}
      />
      <Composition
        id='NewsSocialTemplateOne'
        component={SocialTemplateOneComposition}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={180}
        defaultProps={defaultSocialTemplateOneProps}
      />
      <Composition
        id='NewsSocialTemplateTwo'
        component={SocialTemplateTwoComposition}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={180}
        defaultProps={defaultSocialTemplateTwoProps}
      />
      <Composition
        id='NewsSocialTemplateTwoOverlay'
        component={SocialTemplateTwoOverlayComposition}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={180}
        defaultProps={defaultSocialTemplateTwoOverlayProps}
      />
      <Composition
        id='NewsSocialTemplateThreeHeader'
        component={SocialTemplateThreeHeaderComposition}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={180}
        defaultProps={defaultSocialTemplateThreeHeaderProps}
      />
    </>
  )
}
