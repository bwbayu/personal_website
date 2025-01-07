"use client";

import { useEffect, useState } from "react";
import { Card, Tooltip } from "flowbite-react";
import { getProjectsData } from '@/public/data/projects'
import {
    ProjectType
} from "../types/resume";
import 'devicon/devicon.min.css';
import Link from "next/link";
import Image from "next/image";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectType[]>([]);
    const [showDescription, setShowDescription] = useState<number | null>(null);

    useEffect(() => {
        async function fetchData() {
          const [projectData] = await Promise.all([
            getProjectsData(),
          ]);
    
          setProjects(projectData);
        }
    
        fetchData();
    }, []);

    const toggleDescription = (index: number) => {
      setShowDescription((prevIndex) => (prevIndex === index ? null : index));
    };

    return (
      <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
        <h1 className="mb-6 text-3xl font-bold text-gray-800 dark:text-gray-200">
          My Projects
        </h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card
              key={index}
              className="flex flex-col overflow-hidden border dark:border-gray-700"
            >
              {/* Banner Image */}
              {project.banner && (
                <Image
                  src={project.banner}
                  alt={project.name}
                  className="h-40 w-full object-cover"
                />
              )}
  
              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {project.name}
                  </h3>
                  <button
                      onClick={() => toggleDescription(index)}
                      className="text-xl text-blue-600 hover:text-blue-400 dark:text-blue-400"
                  >
                      {showDescription === index ? (
                          <IoIosArrowUp />
                      ) : (
                          <IoIosArrowDown />
                      )}
                  </button>
                </div>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                  {project.date}
                </p>
                <div
                  className={`overflow-hidden transition-[max-height] duration-700 ease-out ${
                      showDescription === index
                          ? "max-h-40"
                          : "max-h-0"
                  }`}
                >
                  <p className="mt-2 text-justify text-sm text-gray-600 dark:text-gray-400">
                      {project.description}
                  </p>
                </div>
  
                <div className="flex flex-row justify-between">
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
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }