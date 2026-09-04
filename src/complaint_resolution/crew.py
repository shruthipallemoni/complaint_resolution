from crewai import Agent, Crew, Process, Task
from crewai.knowledge.source.string_knowledge_source import StringKnowledgeSource
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from .models import ComplaintClassification, ResolutionDraft, GuardrailResult

@CrewBase
class ComplaintResolution():
    """ComplaintResolution crew — defines all agents and tasks.

    Note: the aggregate `crew()` method below runs ALL agents/tasks
    sequentially, which is NOT how this project actually executes.
    The Flow (in flow.py) builds small, single-agent Crews on demand,
    picking only the agent+task needed for each branch. The `crew()`
    method here is kept mainly for quick manual testing of the whole
    pipeline end-to-end via `crewai run`, not for production use.
    """

    agents: list[BaseAgent]
    tasks: list[Task]

    # ---- Agents ----

    @agent
    def classifier_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['classifier_agent'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def auto_resolver_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['auto_resolver_agent'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def escalation_drafter_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['escalation_drafter_agent'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def guardrail_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['guardrail_agent'],  # type: ignore[index]
            verbose=True
        )

    # ---- Tasks ----

    @task
    def classification_task(self) -> Task:
        return Task(
            config=self.tasks_config['classification_task'],  # type: ignore[index]
            agent=self.classifier_agent(),
            output_pydantic=ComplaintClassification,
        )

    @task
    def auto_resolution_task(self) -> Task:
        return Task(
            config=self.tasks_config['auto_resolution_task'],  # type: ignore[index]
            agent=self.auto_resolver_agent(),
            output_pydantic=ResolutionDraft,
        )

    @task
    def escalation_task(self) -> Task:
        return Task(
            config=self.tasks_config['escalation_task'],  # type: ignore[index]
            agent=self.escalation_drafter_agent(),
            output_pydantic=ResolutionDraft,
        )

    @task
    def guardrail_task(self) -> Task:
        return Task(
            config=self.tasks_config['guardrail_task'],  # type: ignore[index]
            agent=self.guardrail_agent(),
            output_pydantic=GuardrailResult,
        )

    # ---- Aggregate crew (manual testing only — see class docstring) ----

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            knowledge_sources=[
                StringKnowledgeSource(file_paths=["knowledge/company_policies.md"]),
                StringKnowledgeSource(file_paths=["knowledge/user_preference.txt"]),
            ],
        )