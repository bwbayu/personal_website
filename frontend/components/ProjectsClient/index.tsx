"use client";

import { Badge, Tooltip, Accordion } from "flowbite-react";
import { BsGlobe2, BsYoutube } from "react-icons/bs";
import "devicon/devicon.min.css";
import Link from "next/link";
import Image from "next/image";
import { isSafeUrl } from "@/lib/url";
import { useProjects, useSkills } from "@/lib/queries";
import { SkillType } from "@/app/types/resume";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";

// Resolve a project's technology ids against the skill map (single source of truth
// for icons + names). Unknown/dangling ids are silently skipped. Shared by the
// "Recent" and "All" project lists so their tech markup stays in sync.
function TechStack({
  technologies,
  skillMap,
}: {
  technologies: string[];
  skillMap: Map<string, SkillType>;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {technologies.map((techId) => {
        const skill = skillMap.get(techId);
        if (!skill) return null;
        return (
          <Tooltip content={skill.name} key={techId}>
            <div className="group relative flex flex-col items-center">
              {skill.iconClass ? (
                <i
                  className={`${skill.iconClass} transition-transform group-hover:scale-110`}
                ></i>
              ) : skill.iconImage && isSafeUrl(skill.iconImage) ? (
                <div className="flex size-8 items-center justify-center rounded-md bg-white p-0.5">
                  <Image
                    src={skill.iconImage}
                    alt={skill.name}
                    width={32}
                    height={32}
                    className="size-full object-contain transition-transform group-hover:scale-110"
                  />
                </div>
              ) : null}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default function ProjectsClient() {
  const projectsQuery = useProjects();
  // Skills are fetched UNFILTERED: project-only skills are isShow:false but still
  // need to resolve here for their icon + name.
  const skillsQuery = useSkills();

  const loading = projectsQuery.isPending || skillsQuery.isPending;
  const error = projectsQuery.isError || skillsQuery.isError;

  if (loading) return <Loading />;
  if (error || !projectsQuery.data || !skillsQuery.data)
    return <ErrorMessage message="Failed to load projects. Please try again later." />;

  const projects = projectsQuery.data;
  const skills = skillsQuery.data;
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
  const recent = projects.slice(0, 3);

  return (
    <div className="flex grow flex-col bg-gray-900 p-6 dark:bg-gray-900">
      <h1 className="mb-6 text-3xl font-bold text-gray-200 dark:text-gray-200">
        Recent Projects
      </h1>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recent.length === 0 && (
          <p className="col-span-full text-gray-400">No recent projects to display.</p>
        )}
        {recent.map((project, index) => (
          <div
            key={index}
            className="animate-fade-in-left-top opacity-0"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationFillMode: "forwards",
            }}
          >
            <div>
              <Accordion>
                <Accordion.Panel>
                  <Accordion.Title>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-white">{project.name}</h3>
                      <div className="flex flex-row gap-2">
                        {project.role.map((role, idx) => (
                          <Badge key={idx} color="success">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Accordion.Title>
                  <Accordion.Content>
                    <p
                      className="animate-fade-in mt-2 text-justify text-sm text-gray-400 opacity-0 dark:text-gray-400"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {project.description}
                    </p>
                  </Accordion.Content>
                  <Accordion.Content>
                    <div
                      className="animate-fade-in flex flex-row items-center justify-between opacity-0"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {/* Tech Stack */}
                      <TechStack
                        technologies={project.technologies}
                        skillMap={skillMap}
                      />
                      <div className="flex flex-row items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 empty:hidden">
                        {project.githubUrl && isSafeUrl(project.githubUrl) && (
                          <Tooltip content="View Repository">
                            <Link
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-3xl text-white hover:text-slate-500"
                            >
                              <i className="devicon-github-original"></i>
                            </Link>
                          </Tooltip>
                        )}
                        {project.url && isSafeUrl(project.url) && (
                          <Tooltip content="View Website">
                            <Link
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-3xl text-white hover:text-slate-500"
                            >
                              <BsGlobe2 />
                            </Link>
                          </Tooltip>
                        )}
                        {project.youtubeUrl && isSafeUrl(project.youtubeUrl) && (
                          <Tooltip content="Watch Video">
                            <Link
                              href={project.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-3xl text-white hover:text-slate-500"
                            >
                              <BsYoutube />
                            </Link>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              </Accordion>
            </div>
          </div>
        ))}
      </div>
      <h1 className="mb-6 mt-10 text-3xl font-bold text-gray-200 dark:text-gray-200">
        All My Projects
      </h1>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 && (
          <p className="col-span-full text-gray-400">No projects to display.</p>
        )}
        {projects.map((project, index) => (
          <div
            key={index}
            className="animate-fade-in-left-top opacity-0"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationFillMode: "forwards",
            }}
          >
            <div>
              <Accordion collapseAll>
                <Accordion.Panel>
                  <Accordion.Title>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-white">{project.name}</h3>
                      <div className="flex flex-row gap-2">
                        {project.role.map((role, idx) => (
                          <Badge key={idx} color="success">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Accordion.Title>
                  <Accordion.Content>
                    <p
                      className="animate-fade-in mt-2 text-justify text-sm text-gray-400 opacity-0 dark:text-gray-400"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {project.description}
                    </p>
                  </Accordion.Content>
                  <Accordion.Content>
                    <div
                      className="animate-fade-in flex flex-row items-center justify-between opacity-0"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {/* Tech Stack */}
                      <TechStack
                        technologies={project.technologies}
                        skillMap={skillMap}
                      />
                      <div className="flex flex-row items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 empty:hidden">
                        {project.githubUrl && isSafeUrl(project.githubUrl) && (
                          <Tooltip content="View Repository">
                            <Link
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-3xl text-white hover:text-slate-500"
                            >
                              <i className="devicon-github-original"></i>
                            </Link>
                          </Tooltip>
                        )}
                        {project.url && isSafeUrl(project.url) && (
                          <Tooltip content="View Website">
                            <Link
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-3xl text-white hover:text-slate-500"
                            >
                              <BsGlobe2 />
                            </Link>
                          </Tooltip>
                        )}
                        {project.youtubeUrl && isSafeUrl(project.youtubeUrl) && (
                          <Tooltip content="Watch Video">
                            <Link
                              href={project.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-3xl text-white hover:text-slate-500"
                            >
                              <BsYoutube />
                            </Link>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              </Accordion>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
