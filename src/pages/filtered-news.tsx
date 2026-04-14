import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { useRouter } from 'next/router'
import axiosInstance from 'src/api/axios/axiosBaseQuery'
import { ENDURL } from 'src/utils/constants/endurl.utils'
import { SocialTemplateOneComposition } from 'src/remotion/SocialTemplateOneComposition'
import { SocialTemplateTwoOverlayComposition } from 'src/remotion/SocialTemplateTwoOverlayComposition'
import { SocialTemplateThreeHeaderComposition } from 'src/remotion/SocialTemplateThreeHeaderComposition'

const Player = dynamic(() => import('@remotion/player').then(mod => mod.Player), { ssr: false })

const LONG_TIMEOUT_MS = 8 * 60 * 1000
const COMMON_FOOTER_TEXT_KEY = 'filtered-news-common-footer-text'

type RssRow = {
  id: number
  source: string
  title: string
  link: string
  pub_date?: string
  status: string
  raw_text?: string
  images?: string[]
  template_image_items?: ImageItem[] | null
  cleaned_text?: string
  template_one?: SocialTemplateOne | null
  template_two?: SocialTemplateTwo | null
  template_three?: SocialTemplateThree | null
  template_pages?: SocialTemplatePage[] | null
  template_music_selection?: TemplateMusicSelection | null
  template_generated_at?: string
  preview_render_state?: FacebookPreviewState | null
  platform_post_state?: PlatformPostStateMap | null
  platform_schedule_state?: PlatformScheduleStateMap | null
  error?: string
  created_at?: string
  finished_at?: string
}

type PlatformPostState = {
  published?: boolean
  templateType?: string
  publishedAt?: string
  title?: string
  caption?: string
  renderJobId?: string
  renderFileName?: string
  postId?: string
  platform?: string
}

type PlatformPostStateMap = Partial<Record<'youtube' | 'instagram' | 'facebook', PlatformPostState>>

type PlatformScheduleState = {
  platform?: string
  scheduled?: boolean
  scheduledAt?: string
  templateType?: string
  title?: string
  caption?: string
  renderJobId?: string
  templateProps?: any
  status?: string
  updatedAt?: string
  scheduledBy?: number
  message?: string
  publishedAt?: string
  result?: any
}

type PlatformScheduleStateMap = Partial<Record<'youtube' | 'instagram' | 'facebook', PlatformScheduleState>>

type FacebookPreviewState = {
  platform?: string
  templateType?: string
  jobId?: string
  fileName?: string
  status?: 'queued' | 'rendering' | 'completed' | 'failed' | string
  message?: string
  updatedAt?: string
}

type SocialTemplateOne = {
  title: string
  subtitle?: string
  shortText?: string
  mediumText?: string
  highlights: string[]
  cta: string
  image?: string | null
  durationSec?: number
}

type SocialTemplateTwo = {
  heading: string[]
  bullets?: string[]
  shortText?: string
  mediumText?: string
  image?: string | null
}

type SocialTemplateThree = {
  title: string
  subtitle?: string
  kicker?: string
  image?: string | null
}

type SocialTemplatePage = {
  pageType?: string
  title?: string
  subtitle?: string
  shortText?: string
  mediumText?: string
  bullets?: string[]
  cta?: string
  image?: string | null
}

type ImageItem = {
  url: string
  isChecked: boolean
  src?: string
  selected?: boolean
}

type MusicCategory = {
  id: number
  category_name: string
}

type MusicTrack = {
  id: number
  title: string
  file_name: string
  original_file_name?: string
  file_url: string
  mime_type?: string
  duration_seconds?: number
  created_at?: string
  updated_at?: string
  categories?: Array<{ id: number; categoryName: string }>
}

type TemplateMusicSelection = {
  templateOne?: MusicTrack | null
  templateTwo?: MusicTrack | null
  templateThree?: MusicTrack | null
}

type Progress = {
  pending: number
  processing: number
  completed: number
  failed: number
}

type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'all' | 'custom'
type PostPlatform = 'YouTube' | 'Instagram' | 'Facebook'
type PostTemplateType = 'templateOne' | 'templateTwo' | 'templateThree'

const toDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const shiftDate = (base: Date, offsetDays: number) => {
  const next = new Date(base)
  next.setDate(next.getDate() + offsetDays)
  return next
}

const getDateRangeFromPreset = (preset: DateRangePreset, customFromDate: string, customToDate: string) => {
  const today = new Date()
  const todayStr = toDateInput(today)

  if (preset === 'today') return { fromDate: todayStr, toDate: todayStr }
  if (preset === 'yesterday') {
    const yesterday = toDateInput(shiftDate(today, -1))
    return { fromDate: yesterday, toDate: yesterday }
  }
  if (preset === 'last7') return { fromDate: toDateInput(shiftDate(today, -6)), toDate: todayStr }
  if (preset === 'last30') return { fromDate: toDateInput(shiftDate(today, -29)), toDate: todayStr }
  if (preset === 'custom') return { fromDate: customFromDate || '', toDate: customToDate || '' }
  return { fromDate: '', toDate: '' }
}

const FilteredNewsPage: NextPage = () => {
  const router = useRouter()
  const [rows, setRows] = useState<RssRow[]>([])
  const [progress, setProgress] = useState<Progress>({ pending: 0, processing: 0, completed: 0, failed: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processingLink, setProcessingLink] = useState<Record<string, boolean>>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<RssRow | null>(null)
  const [editedCleanedText, setEditedCleanedText] = useState('')
  const [bodyLoading, setBodyLoading] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [templateSlideIndex, setTemplateSlideIndex] = useState(0)
  const [draftPages, setDraftPages] = useState<SocialTemplatePage[]>([])
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [templateOneTitleDraft, setTemplateOneTitleDraft] = useState('')
  const [templateOneDescriptionDraft, setTemplateOneDescriptionDraft] = useState('')
  const [templateOneDurationSec, setTemplateOneDurationSec] = useState(10)
  const [templateOneImageMode, setTemplateOneImageMode] = useState<'custom' | 'original'>('custom')
  const [templateTwoImageMode, setTemplateTwoImageMode] = useState<'custom' | 'original'>('custom')
  const [templateThreeImageMode, setTemplateThreeImageMode] = useState<'custom' | 'original'>('custom')
  const [templateImproving, setTemplateImproving] = useState<Record<string, boolean>>({})
  const [templatePromptsOpen, setTemplatePromptsOpen] = useState(false)
  const [templatePromptsLoading, setTemplatePromptsLoading] = useState(false)
  const [templatePrompts, setTemplatePrompts] = useState<any>(null)
  const [musicSelectionDraft, setMusicSelectionDraft] = useState<TemplateMusicSelection>({})
  const [musicDialogOpen, setMusicDialogOpen] = useState(false)
  const [musicDialogTemplate, setMusicDialogTemplate] = useState<'templateOne' | 'templateTwo' | 'templateThree' | null>(null)
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([])
  const [musicCategories, setMusicCategories] = useState<MusicCategory[]>([])
  const [musicLoading, setMusicLoading] = useState(false)
  const [musicError, setMusicError] = useState('')
  const [musicSearch, setMusicSearch] = useState('')
  const [musicCategoryId, setMusicCategoryId] = useState<number | ''>('')
  const [musicSaving, setMusicSaving] = useState(false)
  const [commonContentOpen, setCommonContentOpen] = useState(false)
  const [commonContentText, setCommonContentText] = useState('')
  const [postReviewOpen, setPostReviewOpen] = useState(false)
  const [postReviewTemplate, setPostReviewTemplate] = useState<PostTemplateType | null>(null)
  const [postReviewPlatform, setPostReviewPlatform] = useState<PostPlatform>('YouTube')
  const [postReviewTitle, setPostReviewTitle] = useState('')
  const [postReviewCaption, setPostReviewCaption] = useState('')
  const [postReviewInfo, setPostReviewInfo] = useState('')
  const [postScheduleAt, setPostScheduleAt] = useState('')
  const [postPublishing, setPostPublishing] = useState(false)
  const [facebookRenderJobId, setFacebookRenderJobId] = useState('')
  const [facebookRenderFileName, setFacebookRenderFileName] = useState('')
  const [facebookRenderStatus, setFacebookRenderStatus] = useState<'idle' | 'queued' | 'rendering' | 'completed' | 'failed'>('idle')
  const [facebookRenderMessage, setFacebookRenderMessage] = useState('')
  const [facebookPublishReady, setFacebookPublishReady] = useState(false)
  const [facebookPreparing, setFacebookPreparing] = useState(false)
  const [facebookPreviewUrl, setFacebookPreviewUrl] = useState('')
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('today')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')

  const clampWords = (text: string, maxWords: number) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean)
    if (words.length <= maxWords) return words.join(' ')
    return `${words.slice(0, maxWords).join(' ')}...`
  }

  const lineClampStyle = (lines: number) => ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden'
  })

  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || axiosInstance.defaults.baseURL || '').replace(/\/+$/, '')
  const toAbsoluteUrl = (url?: string | null) => {
    const value = String(url || '').trim()
    if (!value) return ''
    if (/^https?:\/\//i.test(value)) return value
    return `${apiBase}/${value.replace(/^\/+/, '')}`
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COMMON_FOOTER_TEXT_KEY)
      if (saved !== null) setCommonContentText(saved)
    } catch (_) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(COMMON_FOOTER_TEXT_KEY, commonContentText)
    } catch (_) {
      // ignore
    }
  }, [commonContentText])

  const buildDefaultCommonContent = () => {
    const socialText =
      'Follow Run4Dream on Instagram and subscribe to our YouTube channel for more updates like this.'
    const hashtags = [
      '#Run4Dream',
      '#MarketUpdate',
      '#SportsUpdate',
      '#TrendingNews',
      '#BreakingNews',
      '#BusinessNews',
      '#TechNews',
      '#WorldNews',
      '#EntertainmentNews',
      '#ImportantUpdate',
    ].join(' ')
    setCommonContentText(`${socialText}\n\n${hashtags}`)
  }

  const buildPostDraft = (templateType: PostTemplateType) => {
    const footer = commonContentText.trim()
    const footerBlock = footer ? `\n\n${footer}` : ''

    if (templateType === 'templateOne') {
      const title = String(templateOneTitleDraft || detailRow?.template_one?.title || detailRow?.title || '').trim()
      const templateText = [
        templateOneDescriptionDraft || detailRow?.template_one?.subtitle || detailRow?.template_one?.shortText || detailRow?.template_one?.mediumText || '',
        ...(detailRow?.template_one?.highlights || []),
      ]
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .join('\n')
      return { title, caption: `${templateText}${footerBlock}`.trim() }
    }

    if (templateType === 'templateTwo') {
      const title = String(detailRow?.template_two?.heading?.[0] || detailRow?.template_one?.title || detailRow?.title || '').trim()
      const templateText = [
        ...(detailRow?.template_two?.heading || []),
        detailRow?.template_two?.shortText || '',
        ...(detailRow?.template_two?.bullets || []),
        detailRow?.template_two?.mediumText || '',
      ]
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .join('\n')
      return { title, caption: `${templateText}${footerBlock}`.trim() }
    }

    const title = String(detailRow?.template_three?.title || detailRow?.template_two?.heading?.[0] || detailRow?.title || '').trim()
    const templateText = [
      detailRow?.template_three?.subtitle || '',
      detailRow?.template_three?.kicker || '',
      detailRow?.template_one?.subtitle || detailRow?.template_one?.shortText || detailRow?.template_one?.mediumText || '',
    ]
      .map(item => String(item || '').trim())
      .filter(Boolean)
      .join('\n')
    return { title, caption: `${templateText}${footerBlock}`.trim() }
  }

  const openPostReview = (templateType: PostTemplateType) => {
    const draft = buildPostDraft(templateType)
    const scheduledState = getPlatformScheduleState('Facebook')
    setPostReviewTemplate(templateType)
    setPostReviewTitle(draft.title)
    setPostReviewCaption(draft.caption)
    setPostReviewPlatform('Facebook')
    setPostReviewInfo('Review the final post here. Facebook is wired to publish first; the other platform buttons keep you on this page for now.')
    setPostScheduleAt(scheduledState?.scheduledAt ? String(scheduledState.scheduledAt).slice(0, 16) : '')
    setFacebookRenderJobId('')
    setFacebookRenderFileName('')
    setFacebookRenderStatus('idle')
    setFacebookRenderMessage('')
    setFacebookPublishReady(false)
    setFacebookPreparing(false)
    setFacebookPreviewUrl('')
    setPostReviewOpen(true)
    void restoreFacebookPreviewFromDraft(detailRow, templateType)
  }

  const buildFacebookTemplateProps = () => {
    if (!detailRow || !postReviewTemplate) return null
    const selectedMusic = getSelectedMusicTrack('templateOne')
    const selectedImages = selectedImageSources()
    const templateDescription =
      templateOneDescriptionDraft ||
      detailRow.template_one?.subtitle ||
      detailRow.template_one?.shortText ||
      detailRow.template_one?.mediumText ||
      ''
    return {
      ...detailRow.template_one,
      brand: 'Run4Dream',
      title: postReviewTitle || detailRow.template_one?.title || detailRow.title || '',
      subtitle: templateDescription,
      shortText: templateDescription,
      mediumText: templateDescription,
      highlights: detailRow.template_one?.highlights || [],
      cta: detailRow.template_one?.cta || '',
      image: toAbsoluteUrl(selectedImages[0] || detailRow.template_one?.image || detailRow?.images?.[0] || ''),
      audioUrl: toAbsoluteUrl(selectedMusic?.file_url),
      durationSec: templateOneDurationSec,
      imageMode: templateOneImageMode,
    }
  }

  const buildScheduledTemplateProps = () => {
    if (!detailRow || !postReviewTemplate) return null
    const selectedImages = selectedImageSources()
    const selectedMusicOne = getSelectedMusicTrack('templateOne')
    const selectedMusicTwo = getSelectedMusicTrack('templateTwo')
    const selectedMusicThree = getSelectedMusicTrack('templateThree')

    if (postReviewTemplate === 'templateTwo') {
      return {
        ...detailRow.template_two,
        brand: 'Run4Dream',
        image: toAbsoluteUrl(selectedImages[1] || selectedImages[0] || detailRow.template_two?.image || detailRow?.images?.[0] || ''),
        audioUrl: toAbsoluteUrl(selectedMusicTwo?.file_url),
        imageMode: templateTwoImageMode,
      }
    }

    if (postReviewTemplate === 'templateThree') {
      return {
        ...detailRow.template_three,
        brand: 'Run4Dream',
        image: toAbsoluteUrl(selectedImages[0] || detailRow.template_three?.image || detailRow?.images?.[0] || ''),
        audioUrl: toAbsoluteUrl(selectedMusicThree?.file_url),
        imageMode: templateThreeImageMode,
      }
    }

    return {
      ...buildFacebookTemplateProps(),
      audioUrl: toAbsoluteUrl(selectedMusicOne?.file_url),
    }
  }

  const pollFacebookRenderStatus = async (jobId: string) => {
    let done = false
    while (!done) {
      try {
        const response = await axiosInstance.get(ENDURL.SOCIAL_ACCOUNTS_ITEM.replace(':platform', 'facebook') + `/prepare/${jobId}`)
        const job = response.data?.data
        setFacebookRenderStatus(job?.status || 'idle')
        setFacebookRenderMessage(job?.error || job?.status || '')
        if (job?.status === 'completed') {
          setFacebookPublishReady(true)
          setFacebookRenderFileName(job?.fileName || '')
          setFacebookPreviewUrl(job?.fileName ? toAbsoluteUrl(`content/news-content/videos/rendered/${job.fileName}`) : '')
          setFacebookPreparing(false)
          setFacebookRenderMessage('Facebook render is ready to publish.')
          await persistFacebookPreviewState({
            platform: 'facebook',
            templateType: postReviewTemplate || 'templateOne',
            jobId,
            fileName: job?.fileName || '',
            status: 'completed',
            message: 'Facebook render is ready to publish.',
            updatedAt: new Date().toISOString(),
          })
          done = true
        } else if (job?.status === 'failed') {
          setFacebookPublishReady(false)
          setFacebookPreparing(false)
          await persistFacebookPreviewState({
            platform: 'facebook',
            templateType: postReviewTemplate || 'templateOne',
            jobId,
            fileName: job?.fileName || '',
            status: 'failed',
            message: job?.error || 'Facebook render failed',
            updatedAt: new Date().toISOString(),
          })
          done = true
        } else {
          await new Promise(resolve => setTimeout(resolve, 2500))
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Unable to check Facebook render status'
        const renderFileName = String(facebookRenderFileName || '').trim()
        if (renderFileName && /not found/i.test(errorMessage)) {
          setFacebookRenderStatus('completed')
          setFacebookPublishReady(true)
          setFacebookPreparing(false)
          setFacebookRenderMessage('Facebook render is ready to publish.')
          setFacebookPreviewUrl(toAbsoluteUrl(`content/news-content/videos/rendered/${renderFileName}`))
          await persistFacebookPreviewState({
            platform: 'facebook',
            templateType: postReviewTemplate || 'templateOne',
            jobId,
            fileName: renderFileName,
            status: 'completed',
            message: 'Facebook render is ready to publish.',
            updatedAt: new Date().toISOString(),
          })
          done = true
          continue
        }
        setFacebookRenderStatus('failed')
        setFacebookRenderMessage(errorMessage)
        setFacebookPublishReady(false)
        setFacebookPreparing(false)
        done = true
      }
    }
  }

  const prepareFacebookRender = async () => {
    if (!detailRow || !postReviewTemplate) return
    if (isPlatformPosted('Facebook')) {
      setFacebookRenderMessage('Facebook is already posted for this item.')
      setFacebookPublishReady(false)
      return
    }
    setFacebookPreparing(true)
    setFacebookPublishReady(false)
    setFacebookRenderMessage('Preparing Facebook render...')
    try {
      const payload = {
        title: postReviewTitle,
        caption: [postReviewCaption, commonContentText].filter(Boolean).join('\n\n').trim(),
        templateType: postReviewTemplate,
        rssItemId: detailRow.id,
        templateProps: buildFacebookTemplateProps(),
      }
      const response = await axiosInstance.post(
        ENDURL.SOCIAL_ACCOUNTS_ITEM.replace(':platform', 'facebook') + '/prepare',
        payload,
        { timeout: LONG_TIMEOUT_MS }
      )
      const job = response.data?.data
      setFacebookRenderJobId(job?.jobId || '')
      setFacebookRenderFileName(job?.fileName || '')
      setFacebookRenderStatus(job?.renderStatus || 'queued')
      setFacebookRenderMessage('Facebook render started...')
      setFacebookPreviewUrl('')
      if (job?.jobId || job?.fileName || job?.renderStatus) {
        await persistFacebookPreviewState({
          platform: 'facebook',
          templateType: postReviewTemplate,
          jobId: job?.jobId || '',
          fileName: job?.fileName || '',
          status: job?.renderStatus || 'queued',
          message: 'Facebook render started',
          updatedAt: new Date().toISOString(),
        })
      }
      if (job?.jobId) {
        await pollFacebookRenderStatus(job.jobId)
      }
    } catch (err: any) {
      setFacebookRenderStatus('failed')
      setFacebookRenderMessage(err?.response?.data?.message || err?.message || 'Unable to prepare Facebook render')
      setFacebookPreparing(false)
      setFacebookPublishReady(false)
    }
  }

  const postTemplateToPlatform = async (platform: PostPlatform) => {
    if (!detailRow || !postReviewTemplate) return
    setPostReviewPlatform(platform)
    if (platform !== 'Facebook') {
      setPostReviewInfo(`${platform} selected. Facebook publishing is wired first; the other platform posts stay in review mode for now.`)
      return
    }
    if (isPlatformPosted('Facebook')) {
      setPostReviewInfo('Facebook is already posted for this item.')
      return
    }
    setPostPublishing(true)
    setPostReviewInfo('Publishing to Facebook...')
    try {
      const imageUrl = toAbsoluteUrl(selectedImageSources()[0] || detailRow?.template_one?.image || detailRow?.template_two?.image || detailRow?.template_three?.image || detailRow?.images?.[0] || '')
      const templateProps = buildFacebookTemplateProps()
      const payload = {
        title: postReviewTitle,
        caption: [postReviewCaption, commonContentText].filter(Boolean).join('\n\n').trim(),
        imageUrl,
        link: detailRow.link || '',
        templateType: postReviewTemplate,
        rssItemId: detailRow.id,
        templateProps,
        renderJobId: facebookRenderJobId || undefined,
      }
      const response = await axiosInstance.post(
        ENDURL.SOCIAL_ACCOUNTS_PUBLISH.replace(':platform', 'facebook'),
        payload,
        { timeout: LONG_TIMEOUT_MS }
      )
      const published = response.data?.data
      const nextPlatformState = {
        ...(detailRow.platform_post_state || {}),
        facebook: {
          published: true,
          templateType: postReviewTemplate,
          publishedAt: new Date().toISOString(),
          title: postReviewTitle,
          caption: [postReviewCaption, commonContentText].filter(Boolean).join('\n\n').trim(),
          renderJobId: facebookRenderJobId || '',
          renderFileName: facebookRenderFileName || '',
          postId: published?.result?.id || published?.result?.post_id || '',
          platform: 'facebook',
        },
      }
      const nextRow = { ...detailRow, platform_post_state: nextPlatformState }
      setDetailRow(nextRow)
      setRows(prev => prev.map(row => (row.id === nextRow.id ? nextRow : row)))
      setPostReviewInfo(
        published?.publishedWith === 'photo'
          ? `Facebook photo published successfully.`
          : `Facebook post published successfully.`
      )
    } catch (err: any) {
      setPostReviewInfo(err?.response?.data?.message || err?.message || 'Facebook publish failed')
    } finally {
      setPostPublishing(false)
    }
  }

  const schedulePostToPlatform = async (platform: PostPlatform) => {
    if (!detailRow || !postReviewTemplate) return
    const scheduledAt = String(postScheduleAt || '').trim()
    if (!scheduledAt) {
      setPostReviewInfo('Choose a schedule date and time first.')
      return
    }
    if (isPlatformPosted(platform)) {
      setPostReviewInfo(`${platform} has already been posted for this item.`)
      return
    }
    setPostPublishing(true)
    setPostReviewInfo(`Scheduling for ${platform}...`)
    try {
      const payload = {
        rssItemId: detailRow.id,
        scheduledAt,
        title: postReviewTitle,
        caption: [postReviewCaption, commonContentText].filter(Boolean).join('\n\n').trim(),
        templateType: postReviewTemplate,
        templateProps: buildScheduledTemplateProps(),
        renderJobId: facebookRenderJobId || undefined,
      }
      const response = await axiosInstance.post(
        ENDURL.SOCIAL_ACCOUNTS_ITEM.replace(':platform', platform.toLowerCase()) + '/schedule',
        payload,
        { timeout: LONG_TIMEOUT_MS }
      )
      const scheduled = response.data?.data
      const nextScheduleState = {
        ...(detailRow.platform_schedule_state || {}),
        [platform.toLowerCase()]: {
          scheduled: true,
          scheduledAt: scheduled?.scheduledAt || scheduledAt,
          templateType: postReviewTemplate,
          title: postReviewTitle,
          caption: [postReviewCaption, commonContentText].filter(Boolean).join('\n\n').trim(),
          renderJobId: facebookRenderJobId || '',
          templateProps: buildFacebookTemplateProps(),
          status: 'scheduled',
          updatedAt: new Date().toISOString(),
          scheduledBy: undefined,
        },
      }
      const nextRow = { ...detailRow, platform_schedule_state: nextScheduleState }
      setDetailRow(nextRow)
      setRows(prev => prev.map(row => (row.id === nextRow.id ? nextRow : row)))
      setPostReviewInfo(`${platform} scheduled successfully.`)
    } catch (err: any) {
      setPostReviewInfo(err?.response?.data?.message || err?.message || `Failed to schedule ${platform}`)
    } finally {
      setPostPublishing(false)
    }
  }

  const normalizeMusicSelection = (selection?: TemplateMusicSelection | null): TemplateMusicSelection => {
    const source = selection || {}
    return {
      templateOne: source.templateOne || null,
      templateTwo: source.templateTwo || null,
      templateThree: source.templateThree || null,
    }
  }

  const getSelectedMusicTrack = (template: 'templateOne' | 'templateTwo' | 'templateThree') => {
    const selection = detailRow?.template_music_selection || musicSelectionDraft
    return selection?.[template] || null
  }

  const updateDraftPage = (index: number, patch: Partial<SocialTemplatePage>) => {
    setDraftPages(prev => prev.map((page, idx) => (idx === index ? { ...page, ...patch } : page)))
  }

  const addDraftPage = () => {
    setDraftPages(prev => [
      ...prev,
      {
        pageType: 'custom',
        title: 'New Page',
        subtitle: '',
        shortText: '',
        mediumText: '',
        bullets: [],
        cta: 'Swipe for more',
        image: detailRow?.images?.[0] || null,
      },
    ])
  }

  const syncImageItems = (sources?: string[] | null) => {
    const list = Array.isArray(sources) ? sources.map(src => String(src || '').trim()).filter(Boolean) : []
    setImageItems(list.map(url => ({ url, isChecked: true })))
  }

  const syncImageItemsFromDraft = (items?: ImageItem[] | null, fallbackSources?: string[] | null) => {
    if (Array.isArray(items) && items.length) {
      setImageItems(
        items
          .map(item => ({
            url: String(item?.url || item?.src || '').trim(),
            isChecked: Boolean(item?.isChecked ?? item?.selected)
          }))
          .filter(item => Boolean(item.url))
      )
      return
    }
    syncImageItems(fallbackSources || [])
  }

  const selectedImageSources = (items: ImageItem[] = imageItems) =>
    items.filter(item => item.isChecked).map(item => item.url)

  const persistSelectedImages = async (items: ImageItem[]) => {
    if (!detailRow?.id) return
    try {
      const images = items.filter(item => item.isChecked).map(item => item.url)
      const res = await axiosInstance.put(
        ENDURL.NEWS_CONTENT_RSS_ITEM_DRAFT.replace(':id', String(detailRow.id)),
        { images, templateImageItems: items, templateMusicSelection: musicSelectionDraft },
        { timeout: LONG_TIMEOUT_MS }
      )
      const nextRow = {
        ...detailRow,
        images,
        template_image_items: items,
      }
      setDetailRow(nextRow)
      setRows(prevRows => prevRows.map(row => (row.id === detailRow.id ? nextRow : row)))
      return res?.data?.data || null
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save selected images')
      return null
    }
  }

  const reorderImageItems = (fromIndex: number, toIndex: number) => {
    setImageItems(prev => {
      const next = [...prev]
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= next.length || toIndex >= next.length || fromIndex === toIndex) {
        return next
      }
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      const selected = next.filter(item => item.isChecked).map(item => item.url)
      if (detailRow) {
        setDetailRow({ ...detailRow, images: selected })
        setRows(prevRows => prevRows.map(row => (row.id === detailRow.id ? { ...row, images: selected } : row)))
      }
      void persistSelectedImages(next)
      return next
    })
  }

  const updateImageSelection = (index: number, selected: boolean) => {
    setImageItems(prev => {
      const next = prev.map((item, idx) => (idx === index ? { ...item, isChecked: selected } : item))
      const selectedImages = next.filter(item => item.isChecked).map(item => item.url)
      if (detailRow) {
        setDetailRow({ ...detailRow, images: selectedImages })
        setRows(prevRows => prevRows.map(row => (row.id === detailRow.id ? { ...row, images: selectedImages } : row)))
      }
      void persistSelectedImages(next)
      return next
    })
  }

  const applyImprovedTemplate = (templateType: string, improved: any) => {
    if (!detailRow || !improved) return

    if (templateType === 'templateOne') {
      const next = {
        ...detailRow.template_one,
        ...improved,
      }
      const nextTitle = String(next.title || '')
      const nextDescription = String(next.subtitle || next.shortText || next.mediumText || '')
      setDetailRow({ ...detailRow, template_one: next })
      setTemplateOneTitleDraft(nextTitle)
      setTemplateOneDescriptionDraft(nextDescription)
      setRows(prev => prev.map(row => (row.id === detailRow.id ? { ...row, template_one: next } : row)))
      return
    }

    if (templateType === 'templateTwo') {
      const next = {
        ...detailRow.template_two,
        ...improved,
      }
      setDetailRow({ ...detailRow, template_two: next })
      setRows(prev => prev.map(row => (row.id === detailRow.id ? { ...row, template_two: next } : row)))
      return
    }

    const next = {
      ...detailRow.template_three,
      ...improved,
    }
    setDetailRow({ ...detailRow, template_three: next })
    setRows(prev => prev.map(row => (row.id === detailRow.id ? { ...row, template_three: next } : row)))
  }

  const improveTemplate = async (templateType: 'templateOne' | 'templateTwo' | 'templateThree') => {
    if (!detailRow) return
    try {
      setError('')
      setTemplateImproving(prev => ({ ...prev, [templateType]: true }))

      const current =
        templateType === 'templateOne'
          ? {
              title: templateOneTitleDraft || detailRow.template_one?.title || '',
              subtitle: templateOneDescriptionDraft || detailRow.template_one?.subtitle || '',
              shortText: templateOneDescriptionDraft || detailRow.template_one?.shortText || '',
              mediumText: templateOneDescriptionDraft || detailRow.template_one?.mediumText || '',
              highlights: detailRow.template_one?.highlights || [],
              cta: '',
            }
          : templateType === 'templateTwo'
            ? {
                heading: detailRow.template_two?.heading || [],
                bullets: detailRow.template_two?.bullets || [],
                shortText: detailRow.template_two?.shortText || '',
                mediumText: detailRow.template_two?.mediumText || '',
              }
            : {
                title: detailRow.template_three?.title || '',
                subtitle: detailRow.template_three?.subtitle || '',
                kicker: detailRow.template_three?.kicker || '',
              }

      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_IMPROVE_TEMPLATE,
        {
          templateType,
          title: detailRow.title || '',
          cleanedText: detailRow.cleaned_text || '',
          images: selectedImageSources(),
          current,
        },
        { timeout: LONG_TIMEOUT_MS }
      )

      const improved = res?.data?.data?.improved || null
      applyImprovedTemplate(templateType, improved)

      if (detailRow && improved) {
        const templatePayload =
          templateType === 'templateOne'
            ? { templateOne: { ...improved, durationSec: templateOneDurationSec } }
            : templateType === 'templateTwo'
              ? { templateTwo: improved }
              : { templateThree: improved }
        await axiosInstance.put(
          ENDURL.NEWS_CONTENT_RSS_ITEM_DRAFT.replace(':id', String(detailRow.id)),
          {
            ...templatePayload,
            images: selectedImageSources(),
            templateImageItems: imageItems,
            cleanedText: editedCleanedText || detailRow.cleaned_text || '',
            templatePages: draftPages,
            templateMusicSelection: musicSelectionDraft,
          },
          { timeout: LONG_TIMEOUT_MS }
        )
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to improve template')
    } finally {
      setTemplateImproving(prev => ({ ...prev, [templateType]: false }))
    }
  }

  const syncTemplateOneDrafts = (row?: RssRow | null) => {
    const title = String(row?.template_one?.title || row?.title || '')
    const description = String(
      row?.template_one?.subtitle || row?.template_one?.shortText || row?.template_one?.mediumText || ''
    )
    setTemplateOneTitleDraft(title)
    setTemplateOneDescriptionDraft(description)
    const duration = Number(row?.template_one?.durationSec || 10)
    setTemplateOneDurationSec(Number.isFinite(duration) && duration > 0 ? duration : 10)
  }

  const syncMusicDrafts = (row?: RssRow | null) => {
    setMusicSelectionDraft(normalizeMusicSelection(row?.template_music_selection || null))
  }

  const getPlatformState = (platform: PostPlatform) => {
    const key = String(platform || '').trim().toLowerCase() as keyof PlatformPostStateMap
    return detailRow?.platform_post_state?.[key] || null
  }

  const isPlatformPosted = (platform: PostPlatform) => Boolean(getPlatformState(platform)?.published)
  const getPlatformScheduleState = (platform: PostPlatform) => {
    const key = String(platform || '').trim().toLowerCase() as keyof PlatformScheduleStateMap
    return detailRow?.platform_schedule_state?.[key] || null
  }
  const isPlatformScheduled = (platform: PostPlatform) => {
    const state = getPlatformScheduleState(platform)
    return Boolean(state?.scheduled) && !Boolean(getPlatformState(platform)?.published)
  }
  const platformButtonSx = (platform: PostPlatform) => {
    if (!isPlatformPosted(platform)) return undefined
    return {
      bgcolor: 'success.main',
      color: 'common.white',
      '&:hover': { bgcolor: 'success.dark' },
    }
  }

  const persistFacebookPreviewState = async (state: FacebookPreviewState | null) => {
    if (!detailRow?.id) return
    try {
      const res = await axiosInstance.put(
        ENDURL.NEWS_CONTENT_RSS_ITEM_DRAFT.replace(':id', String(detailRow.id)),
        { previewRenderState: state },
        { timeout: LONG_TIMEOUT_MS }
      )
      const updated = res?.data?.data
      const nextRow = updated ? { ...detailRow, ...updated, preview_render_state: state } : { ...detailRow, preview_render_state: state }
      setDetailRow(nextRow)
      setRows(prev => prev.map(row => (row.id === nextRow.id ? nextRow : row)))
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save preview state')
    }
  }

  const restoreFacebookPreviewFromDraft = async (row?: RssRow | null, templateType?: PostTemplateType | null) => {
    const state = row?.preview_render_state || null
    if (
      !state ||
      String(state.platform || '').toLowerCase() !== 'facebook' ||
      (templateType && String(state.templateType || '').trim() && String(state.templateType || '').trim() !== templateType)
    ) {
      setFacebookRenderJobId('')
      setFacebookRenderFileName('')
      setFacebookRenderStatus('idle')
      setFacebookRenderMessage('')
      setFacebookPublishReady(false)
      setFacebookPreviewUrl('')
      setFacebookPreparing(false)
      return
    }

    const status = String(state.status || 'queued').toLowerCase() as 'idle' | 'queued' | 'rendering' | 'completed' | 'failed'
    setFacebookRenderJobId(String(state.jobId || ''))
    setFacebookRenderFileName(String(state.fileName || ''))
    setFacebookRenderStatus(status === 'completed' || status === 'failed' ? status : (status === 'rendering' ? 'rendering' : 'queued'))
    setFacebookRenderMessage(String(state.message || (status === 'completed' ? 'Facebook render is ready to publish.' : 'Facebook preview is queued.')))
    setFacebookPublishReady(status === 'completed')
    setFacebookPreparing(status === 'queued' || status === 'rendering')
    setFacebookPreviewUrl(
      status === 'completed' && String(state.fileName || '').trim()
        ? toAbsoluteUrl(`content/news-content/videos/rendered/${String(state.fileName).trim()}`)
        : ''
    )

    if (state.jobId && status !== 'completed' && status !== 'failed') {
      await pollFacebookRenderStatus(String(state.jobId))
    }
  }

  const loadMusicLibrary = async (options?: { search?: string; categoryId?: number | '' }) => {
    try {
      setMusicLoading(true)
      setMusicError('')
      const searchValue = typeof options?.search === 'string' ? options.search : musicSearch
      const categoryValue = typeof options?.categoryId !== 'undefined' ? options.categoryId : musicCategoryId
      const [tracksRes, categoriesRes] = await Promise.all([
        axiosInstance.get(ENDURL.NEWS_CONTENT_MUSIC_LIBRARY_TRACKS, {
          timeout: LONG_TIMEOUT_MS,
          params: searchValue
            ? { search: searchValue, ...(categoryValue ? { categoryId: categoryValue } : {}) }
            : categoryValue
              ? { categoryId: categoryValue }
              : {},
        }),
        axiosInstance.get(ENDURL.NEWS_CONTENT_MUSIC_LIBRARY_CATEGORIES, { timeout: LONG_TIMEOUT_MS }),
      ])
      setMusicTracks(Array.isArray(tracksRes?.data?.data) ? tracksRes.data.data : [])
      setMusicCategories(Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [])
    } catch (err: any) {
      setMusicError(err?.response?.data?.message || err?.message || 'Failed to load music library')
    } finally {
      setMusicLoading(false)
    }
  }

  const openMusicDialog = async (template: 'templateOne' | 'templateTwo' | 'templateThree') => {
    setMusicDialogTemplate(template)
    setMusicDialogOpen(true)
    setMusicError('')
    setMusicSearch('')
    setMusicCategoryId('')
    await loadMusicLibrary({ search: '', categoryId: '' })
  }

  const closeMusicDialog = () => {
    setMusicDialogOpen(false)
    setMusicDialogTemplate(null)
  }

  const saveMusicSelection = async (track: MusicTrack | null) => {
    if (!detailRow?.id || !musicDialogTemplate) return
    try {
      setMusicSaving(true)
      setError('')
      const nextSelection = normalizeMusicSelection(musicSelectionDraft)
      nextSelection[musicDialogTemplate] = track
      setMusicSelectionDraft(nextSelection)
      const optimisticRow = { ...detailRow, template_music_selection: nextSelection }
      setDetailRow(optimisticRow)
      setRows(prev => prev.map(row => (row.id === optimisticRow.id ? optimisticRow : row)))
      const res = await axiosInstance.put(
        ENDURL.NEWS_CONTENT_RSS_ITEM_DRAFT.replace(':id', String(detailRow.id)),
        {
          templateMusicSelection: nextSelection,
        },
        { timeout: LONG_TIMEOUT_MS }
      )
      const updated = res?.data?.data
      const nextRow = updated ? { ...optimisticRow, ...updated, template_music_selection: nextSelection } : optimisticRow
      setDetailRow(nextRow)
      setRows(prev => prev.map(row => (row.id === nextRow.id ? nextRow : row)))
      setMusicSelectionDraft(nextSelection)
      closeMusicDialog()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save music selection')
    } finally {
      setMusicSaving(false)
    }
  }

  const clearMusicSelection = async () => {
    await saveMusicSelection(null)
  }

  const toggleImageMode = (template: 'templateOne' | 'templateTwo' | 'templateThree') => {
    if (template === 'templateOne') {
      setTemplateOneImageMode(prev => (prev === 'custom' ? 'original' : 'custom'))
      return
    }
    if (template === 'templateTwo') {
      setTemplateTwoImageMode(prev => (prev === 'custom' ? 'original' : 'custom'))
      return
    }
    setTemplateThreeImageMode(prev => (prev === 'custom' ? 'original' : 'custom'))
  }

  const load = async () => {
    try {
      setError('')
      setLoading(true)
      const { fromDate, toDate } = getDateRangeFromPreset(dateRangePreset, customFromDate, customToDate)
      if (dateRangePreset === 'custom') {
        if (!fromDate || !toDate) {
          throw new Error('Select both From and To dates for the custom range')
        }
        if (fromDate > toDate) {
          throw new Error('From date cannot be after To date')
        }
      }
      const params = {
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {})
      }
      const [listRes, progRes] = await Promise.all([
        axiosInstance.get(ENDURL.NEWS_CONTENT_RSS_ITEMS, { params, timeout: LONG_TIMEOUT_MS }),
        axiosInstance.get(ENDURL.NEWS_CONTENT_RSS_PROGRESS, { params, timeout: LONG_TIMEOUT_MS })
      ])
      const nextRows = Array.isArray(listRes?.data?.data) ? listRes.data.data : []
      setRows(nextRows)
      setProgress(progRes?.data?.data || { pending: 0, processing: 0, completed: 0, failed: 0 })
      return nextRows
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load filtered news')
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleProcessOne = async (link: string) => {
    if (!link) return
    try {
      setError('')
      setProcessingLink(prev => ({ ...prev, [link]: true }))
      await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_PROCESS_ONE,
        { link },
        { timeout: LONG_TIMEOUT_MS }
      )
      const updatedRows = await load()
      const row = updatedRows.find((item: RssRow) => item.link === link)
      if (row) {
        setDetailRow(row)
        setDetailOpen(true)
        setEditedCleanedText(String(row?.cleaned_text || ''))
        setDraftPages(Array.isArray(row.template_pages) ? row.template_pages : [])
        syncImageItemsFromDraft(row.template_image_items || null, row.images || [])
        syncTemplateOneDrafts(row)
        syncMusicDrafts(row)
        setTemplateOneImageMode('custom')
        setTemplateTwoImageMode('custom')
        setTemplateThreeImageMode('custom')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to process news')
    } finally {
      setProcessingLink(prev => ({ ...prev, [link]: false }))
    }
  }

  const handleOpenDetail = (row: RssRow) => {
    setDetailRow(row)
    setDetailOpen(true)
    setEditedCleanedText(String(row?.cleaned_text || ''))
    setDraftPages(Array.isArray(row.template_pages) ? row.template_pages : [])
    syncImageItemsFromDraft(row.template_image_items || null, row.images || [])
    syncTemplateOneDrafts(row)
    syncMusicDrafts(row)
    setTemplateOneImageMode('custom')
    setTemplateTwoImageMode('custom')
    setTemplateThreeImageMode('custom')
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setDetailRow(null)
    setEditedCleanedText('')
    setDraftPages([])
    setImageItems([])
    setTemplateOneTitleDraft('')
    setTemplateOneDescriptionDraft('')
    setTemplateOneDurationSec(10)
    setMusicSelectionDraft({})
    setPostScheduleAt('')
    closeMusicDialog()
    setTemplateOneImageMode('custom')
    setTemplateTwoImageMode('custom')
    setTemplateThreeImageMode('custom')
  }

  const handleSendToNewsContent = () => {
    if (!detailRow) return
    const footer = commonContentText.trim()
    const baseScript = detailRow.cleaned_text || ''
    const payload = {
      title: detailRow.title || '',
      rawText: detailRow.raw_text || '',
      images: selectedImageSources(),
      script: footer ? `${baseScript}${baseScript ? '\n\n' : ''}${footer}` : baseScript,
      templateMusicSelection: musicSelectionDraft,
    }
    const go = async () => {
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_LINK_VIDEO,
        { link: detailRow.link },
        { timeout: LONG_TIMEOUT_MS }
      )
      const videoId = String(res?.data?.data?.videoId || '')
      if (!videoId) throw new Error('Video id missing')
      try {
        window.localStorage.setItem('newsContentPrefill', JSON.stringify({ ...payload, targetId: videoId }))
      } catch (_) {
        // ignore
      }
      router.push(`/news-content/${videoId}`)
    }
    go().catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to link news content video'))
  }

  useEffect(() => {
    const total = detailRow?.images?.length || 0
    if (!detailOpen || total <= 1) return
    setCarouselIndex(0)
    const timer = setInterval(() => {
      setCarouselIndex(prev => (total ? (prev + 1) % total : 0))
    }, 2500)
    return () => clearInterval(timer)
  }, [detailOpen, detailRow?.images?.length])

  useEffect(() => {
    if (!detailOpen) return
    setTemplateSlideIndex(0)
    const timer = setInterval(() => {
      setTemplateSlideIndex(prev => (prev + 1) % 3)
    }, 2600)
    return () => clearInterval(timer)
  }, [detailOpen])

  const handleFetchArticleBody = async () => {
    if (!detailRow?.link) return
    try {
      setBodyLoading(true)
      const res = await axiosInstance.post(
        ENDURL.NEWS_CONTENT_RSS_ARTICLE_BODY,
        { link: detailRow.link },
        { timeout: LONG_TIMEOUT_MS }
      )
      const rawText = String(res?.data?.data?.rawText || '').trim()
      const images = Array.isArray(res?.data?.data?.images) ? res.data.data.images : []
      const nextRow = { ...detailRow, raw_text: rawText, images }
      setDetailRow(nextRow)
      setRows(prev => prev.map(row => (row.id === nextRow.id ? nextRow : row)))
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch article body')
    } finally {
      setBodyLoading(false)
    }
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Unable to read file'))
      reader.readAsDataURL(file)
    })

  const handleUploadImages = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      setError('')
      const nextItems: ImageItem[] = []
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file)
        const res = await axiosInstance.post(
          ENDURL.NEWS_UPLOAD_SCENE_IMAGE,
          { fileName: file.name, dataUrl },
          { timeout: LONG_TIMEOUT_MS }
        )
        const imageUrl = String(res?.data?.data?.imageUrl || '').trim()
        if (imageUrl) {
          nextItems.push({ url: imageUrl, isChecked: true })
        }
      }
      setImageItems(prev => {
        const next = [...prev, ...nextItems]
        const selected = next.filter(item => item.isChecked).map(item => item.url)
        if (detailRow) {
          setDetailRow({ ...detailRow, images: selected })
          setRows(prevRows => prevRows.map(row => (row.id === detailRow.id ? { ...row, images: selected } : row)))
        }
        void persistSelectedImages(next)
        return next
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload images')
    }
  }

  const loadTemplatePrompts = async () => {
    try {
      setTemplatePromptsLoading(true)
      const res = await axiosInstance.get(ENDURL.NEWS_CONTENT_RSS_TEMPLATE_PROMPTS, { timeout: LONG_TIMEOUT_MS })
      setTemplatePrompts(res?.data?.data || null)
      setTemplatePromptsOpen(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load template prompts')
    } finally {
      setTemplatePromptsLoading(false)
    }
  }

  useEffect(() => {
    if (dateRangePreset !== 'custom') {
      load()
      return
    }

    if (customFromDate && customToDate) {
      load()
    }
  }, [dateRangePreset, customFromDate, customToDate])

  const selectedImages = selectedImageSources()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Stack spacing={3}>
          <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
            <Typography variant='h4' sx={{ fontWeight: 700 }}>
              Filtered News
            </Typography>
            <Stack direction='row' spacing={1.5}>
              <Button variant='outlined' onClick={load} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant='contained' onClick={loadTemplatePrompts} disabled={templatePromptsLoading}>
                {templatePromptsLoading ? 'Loading prompts...' : 'View Template Prompts'}
              </Button>
              <Button variant='outlined' onClick={() => setCommonContentOpen(prev => !prev)}>
                {commonContentOpen ? 'Hide Common Content' : 'Common Content'}
              </Button>
            </Stack>
          </Stack>

          {commonContentOpen ? (
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction='row' spacing={1.5} alignItems='center' justifyContent='space-between'>
                    <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                      Common Caption
                    </Typography>
                    <Button variant='outlined' onClick={buildDefaultCommonContent}>
                      Use Default Social Footer
                    </Button>
                  </Stack>
                  <TextField
                    label='Common Content'
                    value={commonContentText}
                    onChange={e => setCommonContentText(e.target.value)}
                    placeholder='Follow Run4Dream on Instagram and subscribe to our YouTube channel...'
                    multiline
                    minRows={4}
                    helperText='Saved in localStorage. Appended to the end of each generated post.'
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                <FormControl size='small' sx={{ minWidth: 220 }}>
                  <InputLabel id='filtered-news-date-range-label'>Date Range</InputLabel>
                  <Select
                    labelId='filtered-news-date-range-label'
                    value={dateRangePreset}
                    label='Date Range'
                    onChange={e => setDateRangePreset(e.target.value as DateRangePreset)}
                  >
                    <MenuItem value='today'>Today</MenuItem>
                    <MenuItem value='yesterday'>Yesterday</MenuItem>
                    <MenuItem value='last7'>Last 7 Days</MenuItem>
                    <MenuItem value='last30'>Last 30 Days</MenuItem>
                    <MenuItem value='all'>All Data</MenuItem>
                    <MenuItem value='custom'>Custom Range</MenuItem>
                  </Select>
                </FormControl>

                {dateRangePreset === 'custom' ? (
                  <>
                    <TextField
                      size='small'
                      type='date'
                      label='From'
                      value={customFromDate}
                      onChange={e => setCustomFromDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      size='small'
                      type='date'
                      label='To'
                      value={customToDate}
                      onChange={e => setCustomToDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                ) : null}

                <Typography variant='body2' color='text.secondary'>
                  Default view loads only today&apos;s saved filtered news.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction='row' spacing={3}>
              <Typography variant='body2'>Pending: {progress.pending}</Typography>
              <Typography variant='body2'>Processing: {progress.processing}</Typography>
              <Typography variant='body2'>Completed: {progress.completed}</Typography>
              <Typography variant='body2'>Failed: {progress.failed}</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{String(row.cleaned_text || row.error || '').slice(0, 160)}</TableCell>
                    <TableCell>
                      {row.finished_at ? new Date(row.finished_at).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size='small'
                        variant='contained'
                        disabled={processingLink[row.link]}
                        onClick={() => handleProcessOne(row.link)}
                      >
                        {processingLink[row.link] ? 'Processing...' : 'Process Now'}
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        sx={{ ml: 1 }}
                        onClick={() => handleOpenDetail(row)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      {loading ? 'Loading...' : 'No filtered news yet.'}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      {error ? (
        <Grid item xs={12}>
          <Alert severity='error'>{error}</Alert>
        </Grid>
      ) : null}

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth='md' fullWidth>
        <DialogTitle>News Detail</DialogTitle>
        <DialogContent>
            <Stack spacing={2}>
              <Button variant='contained' onClick={handleSendToNewsContent}>
                Send To News Content
              </Button>
              <Typography variant='h6'>{detailRow?.title || 'Untitled'}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Source: {detailRow?.source || '-'} • {detailRow?.pub_date ? new Date(detailRow.pub_date).toLocaleString() : '-'}
            </Typography>
            {detailRow?.link ? (
              <Typography variant='body2' color='primary'>
                {detailRow.link}
              </Typography>
            ) : null}
            <Divider />
            <Stack spacing={1}>
              <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                <Typography variant='subtitle2'>Images</Typography>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Button variant='outlined' component='label' size='small'>
                    Upload Images
                    <input
                      hidden
                      type='file'
                      accept='image/*'
                      multiple
                      onChange={event => handleUploadImages(event.target.files)}
                    />
                  </Button>
                  <Button
                    variant='text'
                    size='small'
                    onClick={() => syncImageItemsFromDraft(detailRow?.template_image_items || null, detailRow?.images || [])}
                  >
                    Reset Order
                  </Button>
                </Stack>
              </Stack>
              <Typography variant='body2' color='text.secondary'>
                Check the images you want to use, then drag to reorder them. The selected order is reused for prompts and creation.
              </Typography>
              {imageItems.length ? (
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  {imageItems.map((item, idx) => (
                    <Card
                      key={`${item.url}-${idx}`}
                      draggable
                      onDragStart={event => event.dataTransfer.setData('text/plain', String(idx))}
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        event.preventDefault()
                        const fromIndex = Number(event.dataTransfer.getData('text/plain'))
                        reorderImageItems(fromIndex, idx)
                      }}
                      variant='outlined'
                      sx={{ p: 0.75, width: 150, position: 'relative', cursor: 'grab' }}
                    >
                      <Checkbox
                        checked={item.isChecked}
                        onChange={event => updateImageSelection(idx, event.target.checked)}
                        size='small'
                        sx={{ position: 'absolute', top: 0, left: 0, zIndex: 2, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      />
                      <Typography variant='caption' sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2, bgcolor: 'rgba(0,0,0,0.65)', color: '#fff', px: 0.75, py: 0.25, borderRadius: 1 }}>
                        {idx + 1}
                      </Typography>
                      <img
                        src={item.url}
                        alt={`article-${idx}`}
                        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }}
                      />
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Typography variant='body2' color='text.secondary'>No images selected yet.</Typography>
              )}
            </Stack>
            <Divider />
            <Stack direction='row' spacing={2} alignItems='center'>
              <Typography variant='subtitle2'>Raw Text</Typography>
              <Button size='small' variant='outlined' onClick={handleFetchArticleBody} disabled={bodyLoading}>
                {bodyLoading ? 'Fetching...' : 'Fetch Article Body'}
              </Button>
            </Stack>
            <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
              {detailRow?.raw_text || 'No raw text available.'}
            </Typography>
            <Divider />
            <Typography variant='subtitle2'>Rewritten News</Typography>
            <TextField
              multiline
              minRows={6}
              value={editedCleanedText || detailRow?.cleaned_text || detailRow?.error || ''}
              onChange={event => {
                const value = event.target.value
                setEditedCleanedText(value)
                if (detailRow) {
                  setDetailRow({ ...detailRow, cleaned_text: value })
                }
              }}
              placeholder='No content available yet.'
              sx={{ '& .MuiInputBase-input': { whiteSpace: 'pre-wrap' } }}
              fullWidth
            />
            <Divider />
            <Typography variant='subtitle2'>Template Previews</Typography>
            <Stack spacing={2}>
              {detailRow?.template_one ? (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Typography variant='subtitle2'>Template 1</Typography>
                      <Button size='small' variant='outlined' onClick={() => toggleImageMode('templateOne')}>
                        {templateOneImageMode === 'custom' ? 'Original Image' : 'Custom Image'}
                      </Button>
                    </Stack>
                    <Stack direction='row' spacing={1}>
                      <Button size='small' variant='outlined' onClick={() => openMusicDialog('templateOne')}>
                        Link Music
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => improveTemplate('templateOne')}
                        disabled={Boolean(templateImproving.templateOne)}
                      >
                        {templateImproving.templateOne ? 'Improving...' : 'Improve with Gemini'}
                      </Button>
                      <Button size='small' variant='contained' onClick={() => openPostReview('templateOne')}>
                        Post
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                    Music: {getSelectedMusicTrack('templateOne')?.title || 'Not linked'}
                  </Typography>
                  <Stack spacing={1.25} sx={{ mb: 2 }}>
                    <TextField
                      size='small'
                      label='Title'
                      value={templateOneTitleDraft}
                      onChange={e => setTemplateOneTitleDraft(e.target.value)}
                      helperText='Max 3 words'
                      fullWidth
                    />
                    <TextField
                      multiline
                      minRows={2}
                      size='small'
                      label='Description'
                      value={templateOneDescriptionDraft}
                      onChange={e => setTemplateOneDescriptionDraft(e.target.value)}
                      helperText='Aim for 2-3 lines and under 100 characters'
                      fullWidth
                    />
                    <TextField
                      size='small'
                      type='number'
                      label='Duration (sec)'
                      value={templateOneDurationSec}
                      onChange={e => {
                        const next = Number(e.target.value)
                        setTemplateOneDurationSec(Number.isFinite(next) && next > 0 ? next : 10)
                      }}
                      helperText='Default 10 sec'
                      inputProps={{ min: 1, max: 120 }}
                      fullWidth
                    />
                  </Stack>
                  <Player
                    component={SocialTemplateOneComposition as any}
                    durationInFrames={Math.max(1, Math.round(templateOneDurationSec * 30))}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{
                      ...detailRow.template_one,
                      brand: 'Run4Dream',
                      title: templateOneTitleDraft || detailRow.template_one.title,
                      subtitle: templateOneDescriptionDraft || detailRow.template_one.subtitle,
                      shortText: templateOneDescriptionDraft || detailRow.template_one.shortText,
                      mediumText: templateOneDescriptionDraft || detailRow.template_one.mediumText,
                      image: selectedImages[0] || detailRow.template_one.image || detailRow?.images?.[0] || null,
                      audioUrl: toAbsoluteUrl(getSelectedMusicTrack('templateOne')?.file_url),
                      durationSec: templateOneDurationSec,
                      imageMode: templateOneImageMode,
                    }}
                    style={{ width: '100%', maxWidth: 420 }}
                    controls
                  />
                  <Stack spacing={0.5} sx={{ mt: 2 }}>
                    <Typography variant='body2' sx={{ fontWeight: 700 }}>
                      {templateOneTitleDraft || detailRow.template_one.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {templateOneDescriptionDraft || detailRow.template_one.subtitle || detailRow.template_one.shortText || ' '}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {detailRow.template_one.mediumText || ' '}
                    </Typography>
                  </Stack>
                </Card>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Template 1 not generated yet.
                </Typography>
              )}
              {detailRow?.template_two ? (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Typography variant='subtitle2'>Template 2</Typography>
                      <Button size='small' variant='outlined' onClick={() => toggleImageMode('templateTwo')}>
                        {templateTwoImageMode === 'custom' ? 'Original Image' : 'Custom Image'}
                      </Button>
                    </Stack>
                    <Stack direction='row' spacing={1}>
                      <Button size='small' variant='outlined' onClick={() => openMusicDialog('templateTwo')}>
                        Link Music
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => improveTemplate('templateTwo')}
                        disabled={Boolean(templateImproving.templateTwo)}
                      >
                        {templateImproving.templateTwo ? 'Improving...' : 'Improve with Gemini'}
                      </Button>
                      <Button size='small' variant='contained' onClick={() => openPostReview('templateTwo')}>
                        Post
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                    Music: {getSelectedMusicTrack('templateTwo')?.title || 'Not linked'}
                  </Typography>
                  <Player
                    component={SocialTemplateTwoOverlayComposition as any}
                    durationInFrames={180}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{
                      ...detailRow.template_two,
                      brand: 'Run4Dream',
                      image: selectedImages[1] || selectedImages[0] || detailRow.template_two.image || detailRow?.images?.[0] || null,
                      audioUrl: toAbsoluteUrl(getSelectedMusicTrack('templateTwo')?.file_url),
                      imageMode: templateTwoImageMode
                    }}
                    style={{ width: '100%', maxWidth: 420 }}
                    controls
                  />
                  <Stack spacing={0.5} sx={{ mt: 2 }}>
                    <Typography variant='body2' sx={{ fontWeight: 700 }}>
                      {detailRow.template_two.heading.join(' • ')}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {detailRow.template_two.shortText || ' '}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {(detailRow.template_two.bullets || []).join(' • ')}
                    </Typography>
                  </Stack>
                </Card>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Template 2 not generated yet.
                </Typography>
              )}
              {detailRow?.template_three ? (
                <Card variant='outlined' sx={{ p: 2 }}>
                  <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Typography variant='subtitle2'>Template 3</Typography>
                      <Button size='small' variant='outlined' onClick={() => toggleImageMode('templateThree')}>
                        {templateThreeImageMode === 'custom' ? 'Original Image' : 'Custom Image'}
                      </Button>
                    </Stack>
                    <Stack direction='row' spacing={1}>
                      <Button size='small' variant='outlined' onClick={() => openMusicDialog('templateThree')}>
                        Link Music
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => improveTemplate('templateThree')}
                        disabled={Boolean(templateImproving.templateThree)}
                      >
                        {templateImproving.templateThree ? 'Improving...' : 'Improve with Gemini'}
                      </Button>
                      <Button size='small' variant='contained' onClick={() => openPostReview('templateThree')}>
                        Post
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                    Music: {getSelectedMusicTrack('templateThree')?.title || 'Not linked'}
                  </Typography>
                  <Player
                    component={SocialTemplateThreeHeaderComposition as any}
                    durationInFrames={180}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1080}
                    inputProps={{
                      ...detailRow.template_three,
                      brand: 'Run4Dream',
                      image: selectedImages[0] || detailRow.template_three.image || detailRow?.images?.[0] || null,
                      audioUrl: toAbsoluteUrl(getSelectedMusicTrack('templateThree')?.file_url),
                      imageMode: templateThreeImageMode
                    }}
                    style={{ width: '100%', maxWidth: 420 }}
                    controls
                  />
                  <Stack spacing={0.5} sx={{ mt: 2 }}>
                    <Typography variant='body2' sx={{ fontWeight: 700 }}>
                      {detailRow.template_three.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {detailRow.template_three.subtitle || detailRow.template_three.kicker || ' '}
                    </Typography>
                  </Stack>
                </Card>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  Template 3 not generated yet.
                </Typography>
              )}
            </Stack>
            <Divider />
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography variant='subtitle2'>Pages / Carousel Drafts</Typography>
              <Button size='small' variant='outlined' onClick={addDraftPage}>
                Add Page
              </Button>
            </Stack>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              This is the place to add more slides or story pages for social-first posts.
            </Typography>
            <Stack spacing={2}>
              {draftPages.length ? draftPages.map((page, idx) => (
                <Card key={`draft-page-${idx}`} variant='outlined' sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                      <Typography variant='subtitle2'>Page {idx + 1}</Typography>
                      <TextField
                        size='small'
                        label='Page Type'
                        value={page.pageType || ''}
                        onChange={e => updateDraftPage(idx, { pageType: e.target.value })}
                        sx={{ width: 180 }}
                      />
                    </Stack>
                    <TextField
                      size='small'
                      label='Title'
                      value={page.title || ''}
                      onChange={e => updateDraftPage(idx, { title: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      size='small'
                      label='Subtitle'
                      value={page.subtitle || ''}
                      onChange={e => updateDraftPage(idx, { subtitle: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      multiline
                      minRows={2}
                      size='small'
                      label='Short Text'
                      value={page.shortText || ''}
                      onChange={e => updateDraftPage(idx, { shortText: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      multiline
                      minRows={3}
                      size='small'
                      label='Medium Text'
                      value={page.mediumText || ''}
                      onChange={e => updateDraftPage(idx, { mediumText: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      multiline
                      minRows={3}
                      size='small'
                      label='Bullets (one per line)'
                      value={(page.bullets || []).join('\n')}
                      onChange={e => updateDraftPage(idx, { bullets: e.target.value.split('\n').map(line => line.trim()).filter(Boolean) })}
                      fullWidth
                    />
                    <TextField
                      size='small'
                      label='CTA'
                      value={page.cta || ''}
                      onChange={e => updateDraftPage(idx, { cta: e.target.value })}
                      fullWidth
                    />
                    {page.image ? (
                      <Typography variant='body2' color='text.secondary'>
                        Image: {page.image}
                      </Typography>
                    ) : null}
                  </Stack>
                </Card>
              )) : (
                <Typography variant='body2' color='text.secondary'>
                  No carousel pages generated yet.
                </Typography>
              )}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant='subtitle2'>Image Templates (HTML Preview)</Typography>
            <Stack spacing={2}>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Single Image Post
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {selectedImages[0] || detailRow?.images?.[0] ? (
                    <img
                      src={selectedImages[0] || detailRow?.images?.[0] || ''}
                      alt='single-template'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#000'
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: '#0f172a',
                      color: '#fff',
                      padding: '14px 18px',
                      boxShadow: 'none',
                      minHeight: 56
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>
                      <span style={lineClampStyle(2)}>
                        {detailRow?.template_one?.title || detailRow?.title || 'Top Story'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginTop: 6 }}>
                      <span style={lineClampStyle(2)}>
                        {detailRow?.template_one?.subtitle || 'Tap to read the full update'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Single Image Variant (Title Top + Subtitle Footer)
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {selectedImages[0] || detailRow?.images?.[0] ? (
                    <img
                      src={selectedImages[0] || detailRow?.images?.[0] || ''}
                      alt='single-variant-top'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#000'
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      background: '#111827',
                      color: '#fff',
                      padding: '12px 18px',
                      boxShadow: 'none',
                      minHeight: 48
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      <span style={lineClampStyle(2)}>
                        {detailRow?.template_three?.title || detailRow?.template_one?.title || detailRow?.title || 'Top Story'}
                      </span>
                    </div>
                  </div>
                  {detailRow?.template_one?.subtitle ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: '#0f172a',
                        color: '#e2e8f0',
                        padding: '12px 18px',
                        boxShadow: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        minHeight: 56
                      }}
                    >
                      <span style={lineClampStyle(3)}>{detailRow.template_one.subtitle}</span>
                    </div>
                  ) : null}
                </div>
              </Card>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Single Image Variant (Slide Story)
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {templateSlideIndex === 0 ? (
                    <>
                      {detailRow?.images?.[0] ? (
                        <img
                          src={detailRow?.images?.[0] || ''}
                          alt='single-variant-heading'
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            background: '#000'
                          }}
                        />
                      ) : null}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: '#0f172a',
                          color: '#fff',
                          padding: '14px 18px',
                          boxShadow: 'none',
                          minHeight: 64
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 800 }}>
                          <span style={lineClampStyle(3)}>
                            {detailRow?.template_two?.heading?.[0] || detailRow?.template_one?.title || 'Top Story'}
                          </span>
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            right: 14,
                            bottom: 10,
                            fontSize: 12,
                            color: '#facc15',
                            fontWeight: 700
                          }}
                        >
                          Next &gt;
                        </div>
                      </div>
                    </>
                  ) : templateSlideIndex === 1 ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 12,
                        padding: '24px 26px',
                        background: 'linear-gradient(160deg, #0f172a 0%, #1f2937 50%, #0b1120 100%)',
                        color: '#f8fafc'
                      }}
                    >
                      {(detailRow?.template_one?.highlights || detailRow?.template_two?.heading || [])
                        .slice(0, 4)
                        .map((line, idx) => (
                          <div key={`point-${idx}`} style={{ fontSize: 18, fontWeight: 700, color: '#facc15' }}>
                            • {line}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#0b1120'
                      }}
                    >
                      <img
                        src='/images/shorts/shorts_follow.png'
                        alt='shorts-follow'
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </Card>
              <Card variant='outlined' sx={{ p: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  Multi Image Post (Carousel + Highlights)
                </Typography>
                <div
                  style={{
                    width: 420,
                    maxWidth: '100%',
                    aspectRatio: '1 / 1',
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(148,163,184,0.35)'
                  }}
                >
                  {(selectedImages.length || detailRow?.images?.length) ? (
                    <>
                      <img
                        src={(selectedImages.length ? selectedImages : detailRow?.images || [])[carouselIndex % (selectedImages.length || detailRow?.images?.length || 1)]}
                        alt='carousel'
                        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                      />
                      {(() => {
                        const points =
                          detailRow?.template_one?.highlights ||
                          detailRow?.template_two?.heading ||
                          []
                        const totalImages = selectedImages.length || detailRow?.images?.length || 0
                        if (!points.length) return null
                        const perImage = Math.min(totalImages, points.length)
                        const start = (carouselIndex % totalImages) * perImage
                        const slice = points.slice(start, start + perImage)
                        const visible = slice.length ? slice : points.slice(0, perImage)
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              left: 12,
                              bottom: 12,
                              right: 12,
                              background: 'rgba(15,23,42,0.72)',
                              color: '#facc15',
                              padding: '10px 12px',
                              borderRadius: 10
                            }}
                          >
                            {visible.map((point, idx) => (
                              <div key={`hl-${idx}`} style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
                                • {clampWords(point, 10)}
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                      <div
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 999
                        }}
                      >
                        {carouselIndex + 1}/{selectedImages.length || detailRow?.images?.length || 0}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8'
                      }}
                    >
                      No images found.
                    </div>
                  )}
                </div>
              </Card>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={postReviewOpen} onClose={() => setPostReviewOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Review Social Post</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {postReviewInfo || 'Review the full title, template text, and caption before posting.'}
            </Typography>
            <Typography variant='subtitle2'>
              Template:{' '}
              {postReviewTemplate === 'templateOne'
                ? 'Template 1'
                : postReviewTemplate === 'templateTwo'
                  ? 'Template 2'
                  : 'Template 3'}
            </Typography>
            <TextField label='Title' value={postReviewTitle} onChange={e => setPostReviewTitle(e.target.value)} fullWidth />
            <TextField
              label='Caption'
              value={postReviewCaption}
              onChange={e => setPostReviewCaption(e.target.value)}
              multiline
              minRows={8}
              fullWidth
            />
            <Card variant='outlined' sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
              <Button
                variant='contained'
                onClick={prepareFacebookRender}
                disabled={facebookPreparing || postPublishing}
              >
                {facebookPreparing ? 'Preparing...' : facebookPublishReady ? 'Re-render Preview' : 'Preview Render'}
              </Button>
                <Typography variant='caption' color='text.secondary'>
                  Generate the preview video first. Once ready, the platform post buttons unlock.
                </Typography>
              </Stack>
            </Card>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant={postReviewPlatform === 'YouTube' ? 'contained' : 'outlined'}
                onClick={() => postTemplateToPlatform('YouTube')}
                disabled={!facebookPublishReady || postPublishing || isPlatformPosted('YouTube') || isPlatformScheduled('YouTube')}
                sx={platformButtonSx('YouTube')}
              >
                {isPlatformPosted('YouTube') ? 'YouTube Posted' : isPlatformScheduled('YouTube') ? 'YouTube Scheduled' : 'YouTube'}
              </Button>
              <Button
                variant={postReviewPlatform === 'Instagram' ? 'contained' : 'outlined'}
                onClick={() => postTemplateToPlatform('Instagram')}
                disabled={!facebookPublishReady || postPublishing || isPlatformPosted('Instagram') || isPlatformScheduled('Instagram')}
                sx={platformButtonSx('Instagram')}
              >
                {isPlatformPosted('Instagram') ? 'Instagram Posted' : isPlatformScheduled('Instagram') ? 'Instagram Scheduled' : 'Instagram'}
              </Button>
              <Button
                variant={isPlatformPosted('Facebook') || postReviewPlatform === 'Facebook' ? 'contained' : 'outlined'}
                onClick={() => postTemplateToPlatform('Facebook')}
                disabled={!facebookPublishReady || postPublishing || isPlatformPosted('Facebook') || isPlatformScheduled('Facebook')}
                sx={platformButtonSx('Facebook')}
              >
                {postPublishing
                  ? 'Publishing...'
                  : isPlatformPosted('Facebook')
                    ? 'Facebook Posted'
                    : isPlatformScheduled('Facebook')
                      ? 'Facebook Scheduled'
                      : 'Post to Facebook'}
              </Button>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
              <TextField
                label='Schedule At'
                type='datetime-local'
                value={postScheduleAt}
                onChange={e => setPostScheduleAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size='small'
                fullWidth
              />
              <Button
                variant='outlined'
                onClick={() => schedulePostToPlatform(postReviewPlatform)}
                disabled={postPublishing || isPlatformPosted(postReviewPlatform) || isPlatformScheduled(postReviewPlatform)}
                sx={isPlatformScheduled(postReviewPlatform) ? { bgcolor: 'warning.main', color: 'common.white' } : undefined}
              >
                {isPlatformScheduled(postReviewPlatform)
                  ? `${postReviewPlatform} Scheduled`
                  : `Schedule ${postReviewPlatform}`}
              </Button>
            </Stack>
            <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip
                size='small'
                label={isPlatformPosted('Facebook') ? 'Facebook posted' : 'Facebook available'}
                color={isPlatformPosted('Facebook') ? 'success' : 'default'}
                variant={isPlatformPosted('Facebook') ? 'filled' : 'outlined'}
              />
              <Chip
                size='small'
                label={isPlatformScheduled('Facebook') ? 'Facebook scheduled' : 'Facebook not scheduled'}
                color={isPlatformScheduled('Facebook') ? 'warning' : 'default'}
                variant={isPlatformScheduled('Facebook') ? 'filled' : 'outlined'}
              />
              <Chip
                size='small'
                label={isPlatformPosted('Instagram') ? 'Instagram posted' : 'Instagram available'}
                color={isPlatformPosted('Instagram') ? 'success' : 'default'}
                variant={isPlatformPosted('Instagram') ? 'filled' : 'outlined'}
              />
              <Chip
                size='small'
                label={isPlatformScheduled('Instagram') ? 'Instagram scheduled' : 'Instagram not scheduled'}
                color={isPlatformScheduled('Instagram') ? 'warning' : 'default'}
                variant={isPlatformScheduled('Instagram') ? 'filled' : 'outlined'}
              />
              <Chip
                size='small'
                label={isPlatformPosted('YouTube') ? 'YouTube posted' : 'YouTube available'}
                color={isPlatformPosted('YouTube') ? 'success' : 'default'}
                variant={isPlatformPosted('YouTube') ? 'filled' : 'outlined'}
              />
              <Chip
                size='small'
                label={isPlatformScheduled('YouTube') ? 'YouTube scheduled' : 'YouTube not scheduled'}
                color={isPlatformScheduled('YouTube') ? 'warning' : 'default'}
                variant={isPlatformScheduled('YouTube') ? 'filled' : 'outlined'}
              />
            </Stack>
            <Typography variant='caption' color='text.secondary'>
              {facebookRenderMessage || (facebookPublishReady ? 'Render complete. Publish buttons are enabled.' : 'Click Ready to render first.')}
            </Typography>
            {facebookPreviewUrl ? (
              <Card variant='outlined' sx={{ mt: 1, overflow: 'hidden' }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant='subtitle2'>Preview</Typography>
                    <Box component='video' controls src={facebookPreviewUrl} sx={{ width: '100%', borderRadius: 1 }} />
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
            <Alert severity='info'>
              Facebook is the first live publish path. YouTube and Instagram become selectable after render, but their live publish APIs are still next.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostReviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={musicDialogOpen} onClose={closeMusicDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          Link Music to{' '}
          {musicDialogTemplate === 'templateOne'
            ? 'Template 1'
            : musicDialogTemplate === 'templateTwo'
              ? 'Template 2'
              : musicDialogTemplate === 'templateThree'
                ? 'Template 3'
                : 'Template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Pick an uploaded track from your music library. This selection is saved with the news draft.
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size='small'
                label='Search tracks'
                value={musicSearch}
                onChange={e => setMusicSearch(e.target.value)}
              />
              <FormControl size='small' fullWidth>
                <InputLabel id='music-category-filter-label'>Category</InputLabel>
                <Select
                  labelId='music-category-filter-label'
                  label='Category'
                  value={musicCategoryId === '' ? '' : String(musicCategoryId)}
                  onChange={e => setMusicCategoryId(e.target.value ? Number(e.target.value) : '')}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 320,
                        width: 320,
                      },
                    },
                  }}
                >
                  <MenuItem value=''>All Categories</MenuItem>
                  {musicCategories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.category_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant='outlined' onClick={() => void loadMusicLibrary()} disabled={musicLoading}>
                {musicLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </Stack>
            {musicError ? <Alert severity='error'>{musicError}</Alert> : null}
            <List dense sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 2 }}>
              {musicTracks.length ? (
                musicTracks.map(track => {
                  const absoluteUrl = toAbsoluteUrl(track.file_url)
                  const selectedTrack = musicDialogTemplate ? getSelectedMusicTrack(musicDialogTemplate) : null
                  const isSelected = Boolean(selectedTrack && selectedTrack.id === track.id)
                  return (
                    <ListItem
                      key={track.id}
                      divider
                      alignItems='flex-start'
                      selected={isSelected}
                      secondaryAction={
                        <Stack direction='row' spacing={1} alignItems='center'>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => saveMusicSelection(track)}
                            disabled={musicSaving}
                            size='small'
                          />
                          <Button variant='contained' size='small' onClick={() => saveMusicSelection(track)} disabled={musicSaving}>
                            Use Track
                          </Button>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={track.title}
                        secondary={
                          <Stack spacing={1} sx={{ mt: 0.5 }}>
                            <Typography variant='caption' color='text.secondary'>
                              {track.original_file_name || track.file_name}
                            </Typography>
                            <Stack direction='row' spacing={0.5} useFlexGap flexWrap='wrap'>
                              {(track.categories || []).map(cat => (
                                <Chip key={`${track.id}-${cat.id}`} size='small' label={cat.categoryName} />
                              ))}
                            </Stack>
                            {absoluteUrl ? (
                              <audio
                                controls
                                preload='none'
                                src={absoluteUrl}
                                style={{ width: '100%' }}
                              />
                            ) : null}
                          </Stack>
                        }
                      />
                    </ListItem>
                  )
                })
              ) : (
                <ListItem>
                  <ListItemText primary={musicLoading ? 'Loading tracks...' : 'No music tracks found.'} />
                </ListItem>
              )}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearMusicSelection} color='inherit' disabled={musicSaving || !musicDialogTemplate}>
            Clear Selection
          </Button>
          <Button onClick={closeMusicDialog} disabled={musicSaving}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={templatePromptsOpen} onClose={() => setTemplatePromptsOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Template Prompts</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            These are the shared prompt notes used for Gemini and the social template editor.
          </Typography>
          <TextField
            multiline
            minRows={18}
            fullWidth
            value={templatePrompts ? JSON.stringify(templatePrompts, null, 2) : ''}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default FilteredNewsPage


