import endent from "endent"
import { limitCodebaseTokens } from "../../limit-codebase-tokens"
import { SPECIFICATION_PREFILL } from "../specification/specification-prompt"

export const PLAN_PREFILL = `<plan>`

export const buildPlanPrompt = async ({
  issue,
  codebaseFiles,
  instructionsContext,
  specification
}: {
  issue: {
    name: string
    description: string
  }
  codebaseFiles: {
    path: string
    content: string
  }[]
  instructionsContext: string
  specification: string
}) => {
  const systemPrompt = endent`
    You are a world-class project manager and software engineer.

    You will be given a codebase to work with, a task to complete, general instructions & guidelines for the task, a specification for the task, and response instructions.

    Your goal is to use this information to create a detailed implementation plan for the given task.`

  const userMessage = endent`
    # Codebase

    The codebase to work with.

    <codebase>
      ${limitCodebaseTokens("", codebaseFiles)}
    </codebase>

    # Task

    The task to complete.

    <task>
      <task_name>${issue.name || "No title provided."}</task_name>
      <task_details>
        ${issue.description || "No details provided."}
      </task_details>
    </task>

    # Instructions and Guidelines

    The instructions and guidelines for the task. Follow these as you build the specification.

    <instructions>
      You should:

      - Stick to the task at hand.
      - Break down the task into clear, logical steps.
      - Focus on implementation details.
      - Always use pseudocode instead of actual code.
      - Never include sections like performance, manual or automated testing, deployment, documentation, etc, unless specifically asked to.

      ${instructionsContext || "No additional instructions provided."}
    </instructions>

    # Specification

    The specification for the task.
    
    ${SPECIFICATION_PREFILL + specification}

    # Response Instructions

    The instructions for how you should respond.
    
    ## Response Information

    Respond with the following information:

    - PLAN: The plan for the task.
      - STEP: A step in the plan. Contains the step text in markdown format.

    ## Response Format

    Respond in the following format:

    <plan>
      <step>__STEP_TEXT__</step>
      ...
    </plan>

    ## Response Example

    An example response:

    <plan>
      <step>Step text here...</step>
      <step>Step text here...</step>
      ...
    </plan>`

  return { systemPrompt, userMessage }
}