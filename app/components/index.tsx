'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import produce, { setAutoFreeze } from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import {
  Bars3Icon,
  CalculatorIcon,
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import useConversation from '@/hooks/use-conversation'
import Toast from '@/app/components/base/toast'
import Sidebar from '@/app/components/sidebar'
import ConfigSence from '@/app/components/config-scence'
import { fetchAppParams, fetchChatList, fetchConversations, generationConversationName, sendChatMessage, updateFeedback } from '@/service'
import type { ChatItem, ConversationItem, Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import type { FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { Resolution, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Chat from '@/app/components/chat'
import MetricCalculator from '@/app/components/metric-calculator'
import ProjectAssistant from '@/app/components/project-assistant'
import ProjectGuide from '@/app/components/project-guide'
import SpecQuery from '@/app/components/spec-query'
import { setLocaleOnClient } from '@/i18n/client'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Loading from '@/app/components/base/loading'
import { replaceVarWithValues, userInputsFormToPromptVariables } from '@/utils/prompt'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO, isShowPrompt, promptTemplate } from '@/config'
import type { Annotation as AnnotationType } from '@/types/log'
import { addFileInfos, sortAgentSorts } from '@/utils/tools'

export interface IMainProps {
  params: any
}

type ActivePage = 'dashboard' | 'chat' | 'spec' | 'metric' | 'evidence' | 'project'
type FeaturePage = Exclude<ActivePage, 'dashboard' | 'chat'>

const isFeaturePage = (page: ActivePage): page is FeaturePage => ['spec', 'metric', 'evidence', 'project'].includes(page)

const isParcelRecognitionConversation = (conversation: ConversationItem) => {
  const name = conversation.name || ''
  return name.includes('请识别') && name.includes('城市绿地规划底图')
}

const isInternalJsonTaskText = (content = '') => {
  const text = content.trim()
  if (!text.startsWith('{')) {
    return false
  }

  return [
    '"task_type"',
    'case_assistant',
    'case_keywords_to_green_space_norms',
    'indicator_guidance',
    'retrieval_chain',
    'output_schema',
  ].some(keyword => text.includes(keyword))
}

const isInternalJsonTaskConversation = (conversation: ConversationItem) => {
  return isInternalJsonTaskText(conversation.name || '')
}

const filterVisibleConversations = (conversations: ConversationItem[]) => {
  return conversations.filter(item => !isParcelRecognitionConversation(item) && !isInternalJsonTaskConversation(item))
}

const Main: FC<IMainProps> = () => {
  const HOME_FEATURES_LOCKED = false
  const { t } = useTranslation()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const hasSetAppConfig = APP_ID && API_KEY

  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [inited, setInited] = useState<boolean>(false)
  const [isShowSidebar, { setTrue: showSidebar, setFalse: hideSidebar }] = useBoolean(false)
  const [visionConfig, setVisionConfig] = useState<VisionSettings | undefined>({
    enabled: false,
    number_limits: 2,
    detail: Resolution.low,
    transfer_methods: [TransferMethod.local_file],
  })
  const [fileConfig, setFileConfig] = useState<FileUpload | undefined>()
  const [isLandingVisible, setIsLandingVisible] = useState(true)
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [homeQuery, setHomeQuery] = useState('')
  const [pendingHomeQuery, setPendingHomeQuery] = useState('')
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Chat App - greenbot'
  }, [APP_INFO?.title])

  useEffect(() => {
    setAutoFreeze(false)
    return () => {
      setAutoFreeze(true)
    }
  }, [])

  const {
    conversationList,
    setConversationList,
    currConversationId,
    getCurrConversationId,
    setCurrConversationId,
    getConversationIdFromStorage,
    isNewConversation,
    currConversationInfo,
    currInputs,
    newConversationInputs,
    resetNewConversationInputs,
    setCurrInputs,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation()

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [isChatStarted, { setTrue: setChatStarted, setFalse: setChatNotStarted }] = useBoolean(false)

  const handleStartChat = (inputs: Record<string, any>) => {
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrInputs(inputs)
    setChatStarted()
    setChatList(generateNewChatListWithOpenStatement('', inputs))
  }

  const hasSetInputs = (() => {
    if (!isNewConversation) { return true }
    return isChatStarted
  })()

  const hasPromptVariables = !!promptConfig?.prompt_variables?.length
  const conversationName = currConversationInfo?.name || t('app.chat.newChatDefaultName') as string
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []
  const homePlaceholder = (() => {
    if (!conversationIntroduction)
    { return 'Whatever you need, just ask Greenbot!' }

    if (currInputs && promptConfig?.prompt_variables?.length)
    { return replaceVarWithValues(conversationIntroduction, promptConfig.prompt_variables, currInputs) }

    return conversationIntroduction
  })()

  const handleConversationSwitch = () => {
    if (!inited) { return }

    let notSyncToStateIntroduction = ''
    let notSyncToStateInputs: Record<string, any> | undefined | null = {}
    if (!isNewConversation) {
      const item = conversationList.find(item => item.id === currConversationId)
      notSyncToStateInputs = item?.inputs || {}
      setCurrInputs(notSyncToStateInputs as any)
      notSyncToStateIntroduction = item?.introduction || ''
      setExistConversationInfo({
        name: item?.name || '',
        introduction: notSyncToStateIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }
    else {
      notSyncToStateInputs = newConversationInputs
      setCurrInputs(notSyncToStateInputs)
    }

    if (!isNewConversation && !conversationIdChangeBecauseOfNew && !isResponding) {
      fetchChatList(currConversationId).then((res: any) => {
        const { data } = res
        const newChatList: ChatItem[] = generateNewChatListWithOpenStatement(notSyncToStateIntroduction, notSyncToStateInputs)

        data.forEach((item: any) => {
          if (isInternalJsonTaskText(item.query || '')) {
            return
          }

          newChatList.push({
            id: `question-${item.id}`,
            content: item.query,
            isAnswer: false,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
          })
          newChatList.push({
            id: item.id,
            content: item.answer,
            agent_thoughts: addFileInfos(item.agent_thoughts ? sortAgentSorts(item.agent_thoughts) : item.agent_thoughts, item.message_files),
            feedback: item.feedback,
            isAnswer: true,
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          })
        })
        setChatList(newChatList)
      })
    }

    if (isNewConversation && isChatStarted) { setChatList(generateNewChatListWithOpenStatement()) }
  }
  useEffect(handleConversationSwitch, [currConversationId, inited])

  const handleConversationIdChange = (id: string) => {
    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
    }
    setCurrConversationId(id, APP_ID)
    setIsLandingVisible(false)
    hideSidebar()
  }

  const handleGoDashboard = () => {
    setActivePage('dashboard')
    setIsLandingVisible(false)
    setChatNotStarted()
    hideSidebar()
    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrConversationId('-1', APP_ID)
    setChatList([])
  }

  const handleGoChatbot = () => {
    setActivePage('chat')
    setIsLandingVisible(false)
    hideSidebar()
    if (currConversationId && currConversationId !== '-1') {
      setCurrConversationId(currConversationId, APP_ID)
      return
    }

    createNewChat()
    setConversationIdChangeBecauseOfNew(true)
    setCurrConversationId('-1', APP_ID)
    setChatStarted()
    setChatList([])
  }

  const handleGoSpecQuery = () => {
    setActivePage('spec')
    setIsLandingVisible(false)
    hideSidebar()
    setChatNotStarted()
  }

  const handleGoMetricCalculator = () => {
    setActivePage('metric')
    setIsLandingVisible(false)
    hideSidebar()
    setChatNotStarted()
    setComingSoonFeature(null)
  }

  const handleGoProjectGuide = () => {
    setActivePage('evidence')
    setIsLandingVisible(false)
    hideSidebar()
    setChatNotStarted()
    setComingSoonFeature(null)
  }

  const handleGoProjectAssistant = () => {
    setActivePage('project')
    setIsLandingVisible(false)
    hideSidebar()
    setChatNotStarted()
    setComingSoonFeature(null)
  }

  const [chatList, setChatList, getChatList] = useGetState<ChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chatListDomRef.current) {
      setTimeout(() => {
        chatListDomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        })
      }, 50)
    }
  }, [chatList, currConversationId])

  const canEditInputs = !chatList.some(item => item.isAnswer === false) && isNewConversation
  useEffect(() => {
    if (!pendingHomeQuery || !isChatStarted)
    { return }

    handleSend(pendingHomeQuery)
    setPendingHomeQuery('')
    setHomeQuery('')
  }, [pendingHomeQuery, isChatStarted])

  const createNewChat = () => {
    if (conversationList.some(item => item.id === '-1')) { return }

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: t('app.chat.newChatDefaultName'),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }))
  }

  const generateNewChatListWithOpenStatement = (introduction?: string, inputs?: Record<string, any> | null) => {
    let calculatedIntroduction = introduction || conversationIntroduction || ''
    const calculatedPromptVariables = inputs || currInputs || null
    if (calculatedIntroduction && calculatedPromptVariables) {
      calculatedIntroduction = replaceVarWithValues(calculatedIntroduction, promptConfig?.prompt_variables || [], calculatedPromptVariables)
    }

    const openStatement = {
      id: `${Date.now()}`,
      content: calculatedIntroduction,
      isAnswer: true,
      feedbackDisabled: true,
      isOpeningStatement: isShowPrompt,
      suggestedQuestions,
    }
    if (calculatedIntroduction) { return [openStatement] }

    return []
  }

  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])
        const { data: conversations, error } = conversationData as { data: ConversationItem[], error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
        }
        const conversationId = getConversationIdFromStorage(APP_ID)
        const visibleConversations = filterVisibleConversations(conversations)
        const currentConversation = visibleConversations.find(item => item.id === conversationId)
        const isNotNewConversation = !!currentConversation

        const { user_input_form, opening_statement: introduction, file_upload, system_parameters, suggested_questions: nextSuggestedQuestions = [] }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
          suggested_questions: nextSuggestedQuestions,
        })
        if (isNotNewConversation) {
          setExistConversationInfo({
            name: currentConversation.name || t('app.chat.newChatDefaultName'),
            introduction,
            suggested_questions: nextSuggestedQuestions,
          })
        }
        const prompt_variables = userInputsFormToPromptVariables(user_input_form)
        setPromptConfig({
          prompt_template: promptTemplate,
          prompt_variables,
        } as PromptConfig)
        const outerFileUploadEnabled = !!file_upload?.enabled
        setVisionConfig({
          ...file_upload?.image,
          enabled: !!(outerFileUploadEnabled && file_upload?.image?.enabled),
          image_file_size_limit: system_parameters?.system_parameters || 0,
        })
        setFileConfig({
          enabled: outerFileUploadEnabled,
          allowed_file_types: file_upload?.allowed_file_types,
          allowed_file_extensions: file_upload?.allowed_file_extensions,
          allowed_file_upload_methods: file_upload?.allowed_file_upload_methods,
          number_limits: file_upload?.number_limits,
          fileUploadConfig: file_upload?.fileUploadConfig,
        })
        setConversationList(visibleConversations as ConversationItem[])

        if (isNotNewConversation) { setCurrConversationId(conversationId, APP_ID, false) }

        setInited(true)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknownReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])

  const [isResponding, { setTrue: setRespondingTrue, setFalse: setRespondingFalse }] = useBoolean(false)
  const [, setAbortController] = useState<AbortController | null>(null)
  const { notify } = Toast
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    if (currConversationId !== '-1') { return true }
    if (!currInputs || !promptConfig?.prompt_variables) { return true }

    let emptyRequiredInput = false
    promptConfig.prompt_variables.forEach((item) => {
      if (item.required && !currInputs[item.key]) { emptyRequiredInput = true }
    })

    if (emptyRequiredInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const [, setMessageTaskId] = useState('')
  const [, setIsRespondingConCurrCon] = useGetState(true)

  const updateCurrentQA = ({
    responseItem,
    questionId,
    placeholderAnswerId,
    questionItem,
  }: {
    responseItem: ChatItem
    questionId: string
    placeholderAnswerId: string
    questionItem: ChatItem
  }) => {
    const newListWithAnswer = produce(
      getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
      (draft) => {
        if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }
        draft.push({ ...responseItem })
      },
    )
    setChatList(newListWithAnswer)
  }

  const transformToServerFile = (fileItem: any) => {
    return {
      type: 'image',
      transfer_method: fileItem.transferMethod,
      url: fileItem.url,
      upload_file_id: fileItem.id,
    }
  }

  const handleSend = async (message: string, files?: VisionFile[]) => {
    if (isResponding) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return
    }
    const toServerInputs: Record<string, any> = {}
    if (currInputs) {
      Object.keys(currInputs).forEach((key) => {
        const value = currInputs[key]
        if (value.supportFileType) { toServerInputs[key] = transformToServerFile(value) }
        else if (value[0]?.supportFileType) { toServerInputs[key] = value.map((item: any) => transformToServerFile(item)) }
        else { toServerInputs[key] = value }
      })
    }

    const data: Record<string, any> = {
      inputs: toServerInputs,
      query: message,
      conversation_id: isNewConversation ? null : currConversationId,
    }

    if (files && files?.length > 0) {
      data.files = files.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
      message_files: (files || []).filter((f: any) => f.type === 'image'),
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    setChatList([...getChatList(), questionItem, placeholderAnswerItem])

    let isAgentMode = false
    const responseItem: ChatItem = {
      id: `${Date.now()}`,
      content: '',
      agent_thoughts: [],
      message_files: [],
      isAnswer: true,
    }
    let hasSetResponseId = false

    const prevTempNewConversationId = getCurrConversationId() || '-1'
    let tempNewConversationId = ''

    setRespondingTrue()
    sendChatMessage(data, {
      getAbortController: (nextAbortController) => {
        setAbortController(nextAbortController)
      },
      onData: (nextMessage: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        if (!isAgentMode) {
          responseItem.content += nextMessage
        }
        else {
          const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts.length - 1]
          if (lastThought) { lastThought.thought += nextMessage }
        }
        if (messageId && !hasSetResponseId) {
          responseItem.id = messageId
          hasSetResponseId = true
        }

        if (isFirstMessage && newConversationId) { tempNewConversationId = newConversationId }

        setMessageTaskId(taskId)
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return
        }
        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      async onCompleted(hasError?: boolean) {
        if (hasError) { return }

        if (getConversationIdChangeBecauseOfNew()) {
          const { data: allConversations }: any = await fetchConversations()
          const visibleConversations = filterVisibleConversations(allConversations)
          if (visibleConversations.length > 0) {
            const newItem: any = await generationConversationName(visibleConversations[0].id)
            const newAllConversations = produce(visibleConversations, (draft: any) => {
              draft[0].name = newItem.name
            })
            setConversationList(newAllConversations as any)
          }
        }
        setConversationIdChangeBecauseOfNew(false)
        resetNewConversationInputs()
        setChatNotStarted()
        setCurrConversationId(tempNewConversationId, APP_ID, true)
        setRespondingFalse()
      },
      onFile(file) {
        const lastThought = responseItem.agent_thoughts?.[responseItem.agent_thoughts.length - 1]
        if (lastThought) { lastThought.message_files = [...(lastThought as any).message_files, { ...file }] }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onThought(thought) {
        isAgentMode = true
        const response = responseItem as any
        if (thought.message_id && !hasSetResponseId) {
          response.id = thought.message_id
          hasSetResponseId = true
        }
        if (response.agent_thoughts.length === 0) {
          response.agent_thoughts.push(thought)
        }
        else {
          const lastThought = response.agent_thoughts[response.agent_thoughts.length - 1]
          if (lastThought.id === thought.id) {
            thought.thought = lastThought.thought
            thought.message_files = lastThought.message_files
            responseItem.agent_thoughts![response.agent_thoughts.length - 1] = thought
          }
          else {
            responseItem.agent_thoughts!.push(thought)
          }
        }
        if (prevTempNewConversationId !== getCurrConversationId()) {
          setIsRespondingConCurrCon(false)
          return false
        }

        updateCurrentQA({
          responseItem,
          questionId,
          placeholderAnswerId,
          questionItem,
        })
      },
      onMessageEnd: (messageEnd) => {
        if (messageEnd.metadata?.annotation_reply) {
          responseItem.id = messageEnd.id
          responseItem.annotation = ({
            id: messageEnd.metadata.annotation_reply.id,
            authorName: messageEnd.metadata.annotation_reply.account.name,
          } as AnnotationType)
          const newListWithAnswer = produce(
            getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
            (draft) => {
              if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }
              draft.push({
                ...responseItem,
              })
            },
          )
          setChatList(newListWithAnswer)
          return
        }
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId)) { draft.push({ ...questionItem }) }
            draft.push({ ...responseItem })
          },
        )
        setChatList(newListWithAnswer)
      },
      onMessageReplace: (messageReplace) => {
        setChatList(produce(
          getChatList(),
          (draft) => {
            const current = draft.find(item => item.id === messageReplace.id)
            if (current) { current.content = messageReplace.answer }
          },
        ))
      },
      onError() {
        setRespondingFalse()
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
      onWorkflowStarted: ({ workflow_run_id }) => {
        responseItem.workflow_run_id = workflow_run_id
        responseItem.workflowProcess = {
          status: WorkflowRunningStatus.Running,
          tracing: [],
        }
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onWorkflowFinished: ({ data }) => {
        responseItem.workflowProcess!.status = data.status as WorkflowRunningStatus
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeStarted: ({ data }) => {
        responseItem.workflowProcess!.tracing!.push(data as any)
        setChatList(produce(getChatList(), (draft) => {
          const currentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[currentIndex] = {
            ...draft[currentIndex],
            ...responseItem,
          }
        }))
      },
      onNodeFinished: ({ data }) => {
        const currentIndex = responseItem.workflowProcess!.tracing!.findIndex(item => item.node_id === data.node_id)
        responseItem.workflowProcess!.tracing[currentIndex] = data as any
        setChatList(produce(getChatList(), (draft) => {
          const draftCurrentIndex = draft.findIndex(item => item.id === responseItem.id)
          draft[draftCurrentIndex] = {
            ...draft[draftCurrentIndex],
            ...responseItem,
          }
        }))
      },
    })
  }

  const handleFeedback = async (messageId: string, feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    const newChatList = chatList.map((item) => {
      if (item.id === messageId) {
        return {
          ...item,
          feedback,
        }
      }
      return item
    })
    setChatList(newChatList)
    notify({ type: 'success', message: t('common.api.success') })
  }

  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO || !promptConfig) { return null }
    return (
      <Sidebar
        list={conversationList}
        onCurrentIdChange={handleConversationIdChange}
        onDashboardClick={handleGoDashboard}
        onChatbotClick={handleGoChatbot}
        onSpecQueryClick={handleGoSpecQuery}
        onMetricClick={handleGoMetricCalculator}
        onEvidenceClick={handleGoProjectGuide}
        onProjectClick={handleGoProjectAssistant}
        mode={activePage}
        currentId={currConversationId}
      />
    )
  }

  const handleGetStarted = () => {
    handleGoDashboard()
  }

  const handleStartFromHome = () => {
    const query = homeQuery.trim()
    if (!query) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return
    }

    setActivePage('chat')
    setIsLandingVisible(false)
    hideSidebar()

    if (hasPromptVariables) {
      handleStartChat({})
      return
    }

    setPendingHomeQuery(query)
    handleStartChat({})
  }

  const handleFeatureComingSoon = (title: string) => {
    if (HOME_FEATURES_LOCKED) {
      setComingSoonFeature(prev => prev === title ? null : title)
      return
    }

    if (title === '规范查询') {
      handleGoSpecQuery()
      return
    }

    if (title === '指标计算') {
      handleGoMetricCalculator()
      return
    }

    if (title === '项目导引') {
      handleGoProjectGuide()
      return
    }

    if (title === '案例辅助') {
      handleGoProjectAssistant()
      return
    }

    setComingSoonFeature(prev => prev === title ? null : title)
  }

  const quickActions = [
    {
      title: '规范查询',
      description: '提供面向绿地规划场景的规范查询，支持按项目类型与关键词快速检索核心标准并精准定位原文出处，高效获取规范依据并理解条文含义。',
      icon: MagnifyingGlassIcon,
      color: 'text-[#65a86f]',
      bg: 'bg-[#edf9ef]',
    },
    {
      title: '指标计算',
      description: '计算绿地规划常见指标，输入基础场地数据即可一键输出关键规划指标，并同步比对相关规范要求为您评估设计方案的合理性。',
      icon: CalculatorIcon,
      color: 'text-[#ff8a1f]',
      bg: 'bg-[#fff4e8]',
    },
    {
      title: '项目导引',
      description: '输入项目基础信息、项目类型与场地特征，自动识别应重点关注的规划指标，帮助快速建立项目画像与指标关注清单。',
      icon: DocumentTextIcon,
      color: 'text-[#4b88ff]',
      bg: 'bg-[#edf4ff]',
    },
    {
      title: '案例辅助',
      description: '依托历年真实课程作业与项目案例提供情境化的规范指导，解析可借鉴方法并关联规范风险。',
      icon: FolderIcon,
      color: 'text-[#9b59ff]',
      bg: 'bg-[#f4edff]',
    },
  ]

  if (appUnavailable) { return <AppUnavailable isUnknownReason={isUnknownReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} /> }
  if (!APP_ID || !APP_INFO || !promptConfig) { return <Loading type='app' /> }

  if (isLandingVisible) {
    return (
      <div className='relative min-h-screen overflow-hidden bg-white px-6 py-6 text-slate-900'>
        <div className='relative mx-auto flex min-h-[calc(100vh_-_3rem)] w-full max-w-[1120px] items-center justify-center'>
          <div className='w-full max-w-[760px] -translate-y-[28px] text-center'>
            <div className='mx-auto inline-flex items-center gap-2 sm:gap-4'>
              <Image
                src='/brand-icon.png'
                alt='Brand icon'
                width={84}
                height={84}
                priority
                className='h-[48px] w-[48px] object-contain sm:h-[84px] sm:w-[84px]'
              />
              <h1
                className='whitespace-nowrap text-[36px] font-normal lowercase leading-none tracking-[-0.015em] text-[#151515] sm:text-[54px]'
                style={{ fontFamily: 'var(--font-google-sans-flex), "Google Sans Flex", "Helvetica Neue", Arial, sans-serif' }}
              >
                greenbot
              </h1>
            </div>
            <div
              className='mx-auto mt-[48px] flex w-fit flex-col items-stretch text-center'
              style={{ fontFamily: 'var(--font-source-han-sans-sc), "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' }}
            >
              <p className='whitespace-nowrap text-[30px] font-semibold leading-[1.12] tracking-[0.01em] text-[#222222]'>
                绿地规划AI智能助手
              </p>
              <p className='mt-[10px] flex w-full items-center justify-between px-[2px] text-[19px] font-semibold leading-none text-[#6a6a6a]'>
                <span>设</span>
                <span>计</span>
                <span>有</span>
                <span>理</span>
                <span>有</span>
                <span>据</span>
              </p>
            </div>

            <div className='mt-[56px] flex flex-col items-center'>
              <button
                className='flex h-[48px] w-[172px] items-center justify-center rounded-full bg-[#69be45] px-[24px] py-[10px] text-[18px] font-medium text-white shadow-[0_20px_45px_-22px_rgba(141,212,88,0.78)] transition hover:bg-[#60b03f]'
                onClick={handleGetStarted}
              >
                <span className='font-medium tracking-normal'>启动</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isFeaturePage(activePage)) {
    const featureBody = activePage === 'spec'
      ? <SpecQuery isMobile={isMobile} />
      : activePage === 'metric'
        ? <MetricCalculator isMobile={isMobile} />
        : activePage === 'evidence'
          ? <ProjectGuide isMobile={isMobile} />
          : <ProjectAssistant isMobile={isMobile} />

    if (isMobile) {
      return (
        <div className='h-screen overflow-hidden bg-[#fcfcfb] text-[#1f2937]'>
          <div className='relative flex h-full flex-col overflow-hidden'>
            {isShowSidebar && (
              <div className='absolute inset-0 z-40 bg-black/30 backdrop-blur-[1px]' onClick={hideSidebar}>
                <div className='h-full w-[316px] bg-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.3)]' onClick={e => e.stopPropagation()}>
                  <Sidebar
                    list={conversationList}
                    onCurrentIdChange={handleConversationIdChange}
                    onDashboardClick={handleGoDashboard}
                    onChatbotClick={handleGoChatbot}
                    onSpecQueryClick={handleGoSpecQuery}
                    onMetricClick={handleGoMetricCalculator}
                    onEvidenceClick={handleGoProjectGuide}
                    onProjectClick={handleGoProjectAssistant}
                    mode={activePage}
                    currentId={currConversationId}
                  />
                </div>
              </div>
            )}

            <div className='bg-white px-4 pb-3 pt-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-[12px]'>
                  <Image src='/brand-icon.png' alt='greenbot' width={38} height={38} className='h-[38px] w-[38px] object-contain' />
                  <span
                    className='text-[21px] font-normal tracking-[0.02em] text-[#171717]'
                    style={{ fontFamily: 'var(--font-google-sans-flex), "Google Sans Flex", "Helvetica Neue", Arial, sans-serif' }}
                  >
                    greenbot
                  </span>
                </div>
                <button
                  type='button'
                  className='flex h-10 w-10 items-center justify-center rounded-full text-[#171717]'
                  onClick={showSidebar}
                  aria-label='Open menu'
                >
                  <Bars3Icon className='h-7 w-7' />
                </button>
              </div>
            </div>

            <div className='min-h-0 flex-1 overflow-hidden'>
              {featureBody}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className='h-screen overflow-hidden bg-white text-[#1f2937]'>
        <div className='flex h-full overflow-hidden bg-white'>
          {renderSidebar()}
          <main className='min-w-0 flex-1 overflow-hidden bg-white'>
            {featureBody}
          </main>
        </div>
      </div>
    )
  }

  if (!hasSetInputs) {
    if (isMobile) {
      return (
        <div className='h-screen overflow-hidden bg-[#fcfcfb] text-[#1f2937]'>
          <div className='relative flex h-full flex-col overflow-hidden'>
            {isShowSidebar && (
              <div className='absolute inset-0 z-40 bg-black/30 backdrop-blur-[1px]' onClick={hideSidebar}>
                <div className='h-full w-[316px] bg-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.3)]' onClick={e => e.stopPropagation()}>
                  <Sidebar
                    list={conversationList}
                    onCurrentIdChange={handleConversationIdChange}
                    onDashboardClick={handleGoDashboard}
                    onChatbotClick={handleGoChatbot}
                    onSpecQueryClick={handleGoSpecQuery}
                    onMetricClick={handleGoMetricCalculator}
                    onEvidenceClick={handleGoProjectGuide}
                    onProjectClick={handleGoProjectAssistant}
                    mode='dashboard'
                    currentId={currConversationId}
                  />
                </div>
              </div>
            )}

            <div className='bg-white px-4 pb-3 pt-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-[12px]'>
                  <Image src='/brand-icon.png' alt='greenbot' width={38} height={38} className='h-[38px] w-[38px] object-contain' />
                  <span
                    className='text-[21px] font-normal tracking-[0.02em] text-[#171717]'
                    style={{ fontFamily: 'var(--font-google-sans-flex), "Google Sans Flex", "Helvetica Neue", Arial, sans-serif' }}
                  >
                    greenbot
                  </span>
                </div>
                <button
                  type='button'
                  className='flex h-10 w-10 items-center justify-center rounded-full text-[#171717]'
                  onClick={showSidebar}
                  aria-label='Open menu'
                >
                  <Bars3Icon className='h-7 w-7' />
                </button>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='mx-auto w-full max-w-xl px-3 pb-6 pt-2'>
                <div className='text-[15px] font-medium text-[#6b7280]'>欢迎使用greenbot</div>
                <h1 className='mt-3 text-[27px] font-semibold leading-[1.08] text-[#111827]'>
                  有什么规范问题需要解决？
                </h1>

                <div className='mt-8 overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white shadow-[0_20px_40px_-32px_rgba(15,23,42,0.16)]'>
                  <textarea
                    value={homeQuery}
                    onChange={e => setHomeQuery(e.target.value)}
                    placeholder={homePlaceholder}
                    className='h-[156px] w-full resize-none border-0 px-6 py-6 text-[16px] text-[#111827] outline-none placeholder:text-[15px] placeholder:text-[#a8b0c2]'
                  />
                  <div className='flex items-center justify-end px-6 py-4'>
                    <button
                      className='flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#74a86f] text-[20px] font-semibold text-white transition hover:bg-[#689963]'
                      onClick={handleStartFromHome}
                    >
                      {'>'}
                    </button>
                  </div>
                </div>

                <div className='mt-16'>
                  <div className='text-[17px] font-semibold text-[#111827]'>功能列表</div>
                  <div className='mt-6 space-y-5'>
                    {quickActions.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          type='button'
                          key={item.title}
                          onClick={() => handleFeatureComingSoon(item.title)}
                          className='relative w-full rounded-[20px] border border-[#eceff3] bg-white px-5 py-5 text-left shadow-[0_18px_40px_-34px_rgba(15,23,42,0.14)] transition hover:-translate-y-[1px] hover:shadow-[0_22px_44px_-32px_rgba(15,23,42,0.18)]'
                        >
                          {comingSoonFeature === item.title && (
                            <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[20px] bg-white/84 backdrop-blur-[1px]'>
                              <div className='rounded-full bg-[#2f9e44] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-18px_rgba(47,158,68,0.8)]'>
                                敬请期待
                              </div>
                            </div>
                          )}
                          <div className='grid min-h-[174px] grid-rows-[56px_40px_1fr] content-start'>
                            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] ${item.bg}`}>
                              <Icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div className='flex items-start pt-6 text-[15px] font-semibold leading-[1.25] text-[#111827]'>{item.title}</div>
                            <p className='pt-6 text-[14px] leading-7 text-[#667085]'>{item.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className='h-screen overflow-hidden bg-white text-[#1f2937]'>
        <div className='flex h-full overflow-hidden bg-white'>
          <Sidebar
            list={conversationList}
            onCurrentIdChange={handleConversationIdChange}
            onDashboardClick={handleGoDashboard}
            onChatbotClick={handleGoChatbot}
            onSpecQueryClick={handleGoSpecQuery}
            onMetricClick={handleGoMetricCalculator}
            onEvidenceClick={handleGoProjectGuide}
            onProjectClick={handleGoProjectAssistant}
            mode='dashboard'
            currentId={currConversationId}
          />

          <main className='flex min-w-0 flex-1 overflow-y-auto bg-white'>
            <div className='mx-auto w-full max-w-6xl px-[40px] pt-[28px] pb-[12px]'>
              <div className='text-[15px] font-medium text-[#6b7280]'>欢迎使用greenbot</div>
              <h1 className='mt-[6px] text-[27px] font-semibold leading-[1.08] text-[#111827]'>
                有什么规范问题需要解决？
              </h1>

              <div className='mt-[18px] overflow-hidden rounded-[22px] border border-[#e5e7eb] bg-white shadow-[0_20px_40px_-32px_rgba(15,23,42,0.16)]'>
                <textarea
                  value={homeQuery}
                  onChange={e => setHomeQuery(e.target.value)}
                  placeholder={homePlaceholder}
                  className='h-[140px] w-full resize-none border-0 px-7 py-6 text-[16px] text-[#111827] outline-none placeholder:text-[15px] placeholder:text-[#a8b0c2]'
                />
                <div className='flex items-center justify-end px-7 py-3'>
                  <div className='flex items-center'>
                    <button
                      className='flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#74a86f] text-[20px] font-semibold text-white transition hover:bg-[#689963]'
                      onClick={handleStartFromHome}
                    >
                      {'>'}
                    </button>
                  </div>
                </div>
              </div>

              <div className='mt-[32px]'>
                <div className='text-[17px] font-semibold text-[#111827]'>功能列表</div>
                <div className='mt-4 grid grid-cols-4 gap-4'>
                  {quickActions.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        type='button'
                        key={item.title}
                        onClick={() => handleFeatureComingSoon(item.title)}
                        className='relative min-h-[272px] rounded-[20px] border border-[#eceff3] bg-white px-5 py-4 text-left shadow-[0_18px_40px_-34px_rgba(15,23,42,0.14)] transition hover:-translate-y-[1px] hover:shadow-[0_22px_44px_-32px_rgba(15,23,42,0.18)]'
                      >
                        {comingSoonFeature === item.title && (
                          <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[20px] bg-white/84 backdrop-blur-[1px]'>
                            <div className='rounded-full bg-[#2f9e44] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-18px_rgba(47,158,68,0.8)]'>
                              敬请期待
                            </div>
                          </div>
                        )}
                        <div className='grid min-h-[232px] grid-rows-[52px_34px_1fr] content-start'>
                          <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[15px] ${item.bg}`}>
                            <Icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <div className='flex items-start pt-6 text-[15px] font-semibold leading-[1.25] text-[#111827]'>{item.title}</div>
                          <p className='pt-4 text-[13px] leading-7 text-[#667085]'>{item.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className='h-screen overflow-hidden bg-[#fcfcfb] text-[#1f2937]'>
        <div className='relative flex h-full flex-col overflow-hidden'>
          {isShowSidebar && (
            <div className='absolute inset-0 z-40 bg-black/30 backdrop-blur-[1px]' onClick={hideSidebar}>
              <div className='h-full w-[316px] bg-white shadow-[0_24px_48px_-24px_rgba(15,23,42,0.3)]' onClick={e => e.stopPropagation()}>
                <Sidebar
                  list={conversationList}
                  onCurrentIdChange={handleConversationIdChange}
                  onDashboardClick={handleGoDashboard}
                  onChatbotClick={handleGoChatbot}
                  onSpecQueryClick={handleGoSpecQuery}
                  onMetricClick={handleGoMetricCalculator}
                  onEvidenceClick={handleGoProjectGuide}
                  onProjectClick={handleGoProjectAssistant}
                  mode='chat'
                  currentId={currConversationId}
                />
              </div>
            </div>
          )}

          <div className='bg-white px-4 pb-3 pt-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-[12px]'>
                <Image src='/brand-icon.png' alt='greenbot' width={38} height={38} className='h-[38px] w-[38px] object-contain' />
                <span
                  className='text-[21px] font-normal tracking-[0.02em] text-[#171717]'
                  style={{ fontFamily: 'var(--font-google-sans-flex), "Google Sans Flex", "Helvetica Neue", Arial, sans-serif' }}
                >
                  greenbot
                </span>
              </div>
              <button
                type='button'
                className='flex h-10 w-10 items-center justify-center rounded-full text-[#171717]'
                onClick={showSidebar}
                aria-label='Open menu'
              >
                <Bars3Icon className='h-7 w-7' />
              </button>
            </div>
          </div>

          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            {hasSetInputs && (
              <div className='shrink-0 px-3 pb-2 pt-1'>
                <ConfigSence
                  conversationName={conversationName}
                  hasSetInputs={hasSetInputs}
                  isPublicVersion={isShowPrompt}
                  siteInfo={APP_INFO}
                  promptConfig={promptConfig}
                  onStartChat={handleStartChat}
                  canEditInputs={canEditInputs}
                  savedInputs={currInputs as Record<string, any>}
                  onInputsChange={setCurrInputs}
                />
              </div>
            )}

            {hasSetInputs && (
              <div className='relative min-h-0 flex-1 pb-2' ref={chatListDomRef}>
                <Chat
                  chatList={chatList}
                  onSend={handleSend}
                  onFeedback={handleFeedback}
                  isResponding={isResponding}
                  checkCanSend={checkCanSend}
                  visionConfig={visionConfig}
                  fileConfig={fileConfig}
                  isMobile
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='h-screen overflow-hidden bg-white'>
      <div className="flex h-full overflow-hidden bg-white">
        {renderSidebar()}
        <div className='flex min-w-0 flex-grow flex-col overflow-y-auto bg-white'>
          {hasSetInputs && (
            <div className='mx-auto w-full max-w-5xl px-8 pt-8'>
              <ConfigSence
                conversationName={conversationName}
                hasSetInputs={hasSetInputs}
                isPublicVersion={isShowPrompt}
                siteInfo={APP_INFO}
                promptConfig={promptConfig}
                onStartChat={handleStartChat}
                canEditInputs={canEditInputs}
                savedInputs={currInputs as Record<string, any>}
                onInputsChange={setCurrInputs}
              />
            </div>
          )}

          {hasSetInputs && (
            <div className='relative mx-auto w-full max-w-5xl flex-1 px-8 pb-4' ref={chatListDomRef}>
              <Chat
                chatList={chatList}
                onSend={handleSend}
                onFeedback={handleFeedback}
                isResponding={isResponding}
                checkCanSend={checkCanSend}
                visionConfig={visionConfig}
                fileConfig={fileConfig}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Main)
