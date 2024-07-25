"use client"

import {
  SelectInstruction,
  SelectIssue,
  SelectIssueMessage,
  SelectProject
} from "@/db/schema"
import {
  AIClarificationItem,
  AIFileInfo,
  AIPlanStep,
  AIThought
} from "@/types/ai"
import { RunStep } from "@/types/run"
import { useState } from "react"
import { parseCodegenActResponse } from "../ai/codegen-system/act/parse-codegen-act-response"
import { runActStep } from "../runs/run-act-step"
import { runCompletedStep } from "../runs/run-completed-step"
import { runEmbeddingStep } from "../runs/run-embedding-step"
import { runPlanStep } from "../runs/run-plan-step"
import { runPRStep } from "../runs/run-pr-step"
import { runRetrievalStep } from "../runs/run-retrieval-step"
import { runStartStep } from "../runs/run-start-step"
import { runThinkStep } from "../runs/run-think-step"
import { runVerifyStep } from "../runs/run-verify-step"

export const useRunIssue = (
  issue: SelectIssue,
  initialIssueMessages: SelectIssueMessage[],
  project: SelectProject,
  attachedInstructions: {
    instructionId: string
    issueId: string
    instruction: SelectInstruction
  }[]
) => {
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState<RunStep>(null)
  const [messages, setMessages] =
    useState<SelectIssueMessage[]>(initialIssueMessages)
  const [clarifications, setClarifications] = useState<AIClarificationItem[]>(
    []
  )
  const [thoughts, setThoughts] = useState<AIThought[]>([])
  const [planSteps, setPlanSteps] = useState<AIPlanStep[]>([])
  const [generatedFiles, setGeneratedFiles] = useState<AIFileInfo[]>([])
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [codebaseFiles, setCodebaseFiles] = useState<
    { path: string; content: string }[]
  >([])
  const [instructionsContext, setInstructionsContext] = useState("")
  const [aiResponses, setAIResponses] = useState<{
    clarify: string | null
    think: string | null
    plan: string | null
    act: string | null
  }>({
    clarify: null,
    think: null,
    plan: null,
    act: null
  })

  const stepFunctions = [
    runStartStep,
    runEmbeddingStep,
    runRetrievalStep,
    // runClarifyStep,
    runThinkStep,
    runPlanStep,
    runActStep,
    runPRStep,
    runVerifyStep,
    runCompletedStep
  ]

  const runNextStep = async (stepIndex = currentStepIndex) => {
    if (stepIndex < stepFunctions.length) {
      const currentStepFunction = stepFunctions[stepIndex]
      const stepName = [
        "started",
        "embedding",
        "retrieval",
        // "clarify",
        "think",
        "plan",
        "act",
        "pr",
        "verify",
        "completed"
      ][stepIndex]
      console.log("stepName", stepName)

      setCurrentStep(stepName as RunStep)

      await currentStepFunction({
        issue,
        project,
        attachedInstructions,
        setCurrentStep,
        setMessages,
        setClarifications,
        setThoughts,
        setPlanSteps,
        setGeneratedFiles,
        codebaseFiles,
        instructionsContext,
        clarifyAIResponse: aiResponses.clarify ?? "",
        thinkAIResponse: aiResponses.think ?? "",
        planAIResponse: aiResponses.plan ?? "",
        actAIResponse: aiResponses.act ?? "",
        parsedActResponse: aiResponses.act
          ? parseCodegenActResponse(aiResponses.act)
          : null,
        setCodebaseFiles,
        setInstructionsContext,
        setAIResponses: (type: keyof typeof aiResponses, response: string) =>
          setAIResponses(prev => ({ ...prev, [type]: response }))
      })

      // If the step is think or plan, we need to wait for confirmation
      if (["think", "plan"].includes(stepName)) {
        setWaitingForConfirmation(true)
        setCurrentStepIndex(stepIndex)
      } else {
        const nextStepIndex = stepIndex + 1
        console.log("stepIndex + 1", nextStepIndex)
        setCurrentStepIndex(nextStepIndex)
        runNextStep(nextStepIndex)
      }
    } else {
      setIsRunning(false)
    }
  }

  const handleRun = async () => {
    if (!project.githubRepoFullName || !project.githubTargetBranch) {
      alert("Please connect your project to a GitHub repository first.")
      return
    }

    setIsRunning(true)
    setCurrentStepIndex(0)
    runNextStep(0)
  }

  const handleConfirmation = () => {
    setWaitingForConfirmation(false)
    const nextStepIndex = currentStepIndex + 1
    console.log("currentStepIndex + 1", nextStepIndex)
    setCurrentStepIndex(nextStepIndex)
    runNextStep(nextStepIndex)
  }

  return {
    isRunning,
    currentStep,
    messages,
    clarifications,
    thoughts,
    planSteps,
    generatedFiles,
    waitingForConfirmation,
    handleRun,
    setThoughts,
    setClarifications,
    setPlanSteps,
    setGeneratedFiles,
    handleConfirmation
  }
}