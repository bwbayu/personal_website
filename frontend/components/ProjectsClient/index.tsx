"use client";

import { Badge, Tooltip, Accordion } from "flowbite-react";
import { ProjectType } from "@/app/types/resume";
import { BsGlobe2 } from "react-icons/bs";
import "devicon/devicon.min.css";
import Link from "next/link";
import Image from "next/image";
import { isSafeUrl } from "@/lib/url";

type Props = {
  projects: ProjectType[];
  recent: ProjectType[];
};

export default function ProjectsClient({ projects, recent }: Props) {
  return (
    <div className="flex grow flex-col bg-gray-900 p-6 dark:bg-gray-900">
      <h1 className="mb-6 text-3xl font-bold text-gray-200 dark:text-gray-200">
        Recent Projects
      </h1>
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="animate-fade-in flex flex-row justify-between opacity-0"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-4">
                        {project.technologies.map((tech, idx) => (
                          <Tooltip content={tech.name} key={idx}>
                            <div className="group relative flex flex-col items-center">
                              {tech.iconClass ? (
                                <i
                                  className={`${tech.iconClass} transition-transform group-hover:scale-110`}
                                ></i>
                              ) : tech.iconImage && isSafeUrl(tech.iconImage) ? (
                                <div className="flex size-8 items-center justify-center rounded-md bg-white p-0.5">
                                  <Image
                                    src={tech.iconImage}
                                    alt={tech.name}
                                    width={32}
                                    height={32}
                                    className="size-full object-contain transition-transform group-hover:scale-110"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                      <div className="flex flex-row gap-2">
                        {project.githubUrl && isSafeUrl(project.githubUrl) && (
                          <Tooltip content="View Repository">
                            <Link
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-2 text-3xl text-white hover:text-slate-500"
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
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="animate-fade-in flex flex-row justify-between opacity-0"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-4">
                        {project.technologies.map((tech, idx) => (
                          <Tooltip content={tech.name} key={idx}>
                            <div className="group relative flex flex-col items-center">
                              {tech.iconClass ? (
                                <i
                                  className={`${tech.iconClass} transition-transform group-hover:scale-110`}
                                ></i>
                              ) : tech.iconImage && isSafeUrl(tech.iconImage) ? (
                                <div className="flex size-8 items-center justify-center rounded-md bg-white p-0.5">
                                  <Image
                                    src={tech.iconImage}
                                    alt={tech.name}
                                    width={32}
                                    height={32}
                                    className="size-full object-contain transition-transform group-hover:scale-110"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                      <div className="flex flex-row gap-2">
                        {project.githubUrl && isSafeUrl(project.githubUrl) && (
                          <Tooltip content="View Repository">
                            <Link
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-2 text-3xl text-white hover:text-slate-500"
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
