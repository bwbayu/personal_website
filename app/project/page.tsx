"use client";

import { useEffect, useState } from "react";
import { Badge , Tooltip, Accordion } from "flowbite-react";
import { getProjectsData } from '@/public/data/projects'
import {
    ProjectType
} from "../types/resume";
import 'devicon/devicon.min.css';
import Link from "next/link";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectType[]>([]);

    useEffect(() => {
        async function fetchData() {
          const [projectData] = await Promise.all([
            getProjectsData(),
          ]);
    
          setProjects(projectData);
        }
    
        fetchData();
    }, []);

    return (
      <div className="flex grow flex-col bg-gray-900 p-6 dark:bg-gray-900">
        <h1 className="mb-6 text-3xl font-bold text-gray-200 dark:text-gray-200">
          My Projects
        </h1>
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div key={index}
              className="animate-fade-in-left-top opacity-0"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationFillMode: "forwards",
              }}>
            <div>
              <Accordion collapseAll>
                <Accordion.Panel>
                  <Accordion.Title>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-bold text-white">{project.name}</h3>
                      <div className="flex flex-row gap-2">
                        {project.role.map((role, idx) => (
                          <Badge key={idx} color="success">{role}</Badge>
                        ))}
                      </div>
                    </div>
                  </Accordion.Title>
                  <Accordion.Content>
                    <p className="mt-2 animate-fade-in text-justify text-sm text-gray-400 opacity-0 dark:text-gray-400"
                    style={{
                      animationDelay: "0.1s",
                      animationFillMode: "forwards",
                    }}>
                        {project.description}
                    </p>
                  </Accordion.Content>
                  <Accordion.Content>
                    <div className="flex animate-fade-in flex-row justify-between opacity-0"
                    style={{
                      animationDelay: "0.1s",
                      animationFillMode: "forwards",
                    }}>
                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-4">
                        {project.tech.map((tech, idx) => (
                          <Tooltip content={tech.name} key={idx}>
                            <div
                              className="group relative flex flex-col items-center"
                            >
                              <i
                                className={`${tech.iconClass} transition-transform group-hover:scale-110`}
                              ></i>
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                      {/* Repository Link */}
                      <Tooltip content="View Repository">
                        <Link
                          href={project.repository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 text-3xl text-white hover:text-slate-500"
                        >
                          <i className="devicon-github-original"></i>
                        </Link>
                      </Tooltip>
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