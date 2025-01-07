"use client";

import { useEffect, useState } from "react";
import { Accordion, Tooltip } from "flowbite-react";
import Image from "next/image";
import { getAboutMeData} from "@/app/data/aboutMe"
import {getSkillsData} from "@/app/data/skills"
import {AboutMeType, SkillType} from '@/app/types/resume'
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const roles = [
  "Back-end Development",
  "Natural Language Processing",
  "Cloud Computing",
  "Machine Learning",
  "Computer Vision",
];

export default function Home() {
  const [self, setSelf] = useState<AboutMeType | null>(null);
  const [skills, setSkills] = useState<SkillType[]>([]);
  const [groupedSkills, setGroupedSkills] = useState<Record<string, SkillType[]>>({});
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  // 
  const [showContactInfo, setShowContactInfo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoleIndex((prevIndex) => (prevIndex + 1) % roles.length);
    }, 2800); // Ganti teks setiap 3 detik

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      async function fetchData() {
        const [selfData, skillData] = await Promise.all([
          getAboutMeData(),
          getSkillsData()
        ]);
  
        setSelf(selfData);
        setSkills(skillData);

        const grouped = skillData.reduce((acc, skill) => {
          if (!acc[skill.category]) {
            acc[skill.category] = [];
          }
          acc[skill.category].push(skill);
          return acc;
        }, {} as Record<string, SkillType[]>);
  
        setGroupedSkills(grouped);
      }
  
      fetchData();
  }, []);

  return (
    <main className="flex flex-grow flex-col items-center justify-center px-10 dark:bg-gray-900 gap-10">
      {/* Profile Image */}
      <div className="flex text-center sm:text-start items-center justify-between xl:justify-around gap-3 md:gap-6 flex-col-reverse sm:flex-row lg:gap-12 w-full pt-10 sm:pt-0 animate-fade-in-left-top opacity-0"
        style={{
          animationDelay: "0.5s",
          animationFillMode: "forwards",
        }}
      >
        {/* Left Section */}
        <div className="items-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
            Hi, I'm Bayu
          </h2>
          <h1 className="mb-6 text-2xl md:text-4xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
            I Passionate about
          </h1>
          <p className="mb-6 text-2xl md:text-4xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
            <span className="relative">
              <span
                className="sm:absolute  w-full animate-fade-in-out text-blue-500 whitespace-nowrap"
                key={currentRoleIndex}
              >
                {roles[currentRoleIndex]}
              </span>
            </span>
          </p>
        </div>
        {/* Right Section */}
        <div className="flex flex-col items-center justify-center animate-fade-in-right-top opacity-0"
          style={{
            animationDelay: "0.5s",
            animationFillMode: "forwards",
          }}
        >
          {/* Profile Picture */}
          <div className="relative size-40 lg:size-60 overflow-hidden rounded-full shadow-lg">
            <Image
              src="/bayuwicaksono_bg.jpg"
              alt="Avatar of Bayu"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <button
            onClick={() => setShowContactInfo((prev) => !prev)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-white hover:text-blue-500 focus:outline-none"
          >
            {showContactInfo ? (
              <>
                Hide Contact <IoIosArrowUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show Contact <IoIosArrowDown className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Contact Information */}
          {showContactInfo && self && (
            <div className="mt-4 text-center lg:mt-6 animate-fade-in opacity-0">
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{self.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{self.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{self.location}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{self.phone_number}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex w-full flex-col gap-4 pb-10 sm:pb-0">
        <h2
          className="text-center text-3xl font-bold text-white animate-fade-in opacity-0"
          style={{
            animationDelay: "0.5s",
            animationFillMode: "forwards",
          }}
        >
          My Toolbox
        </h2>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(groupedSkills).map(([category, skills], idx) => (
            <div
              key={category}
              className="animate-fade-in-left-top opacity-0"
              style={{
                animationDelay: `${idx * 0.2}s`,
                animationFillMode: "forwards",
              }}
            >
              <Accordion collapseAll>
                <Accordion.Panel>
                  <Accordion.Title>
                    <p className="text-white">{category}</p>
                  </Accordion.Title>
                  <Accordion.Content>
                    <div className="flex flex-wrap gap-4 animate-fade-in-left opacity-0"
                    style={{
                      animationDelay: "0.1s",
                      animationFillMode: "forwards",
                    }}>
                      {skills.map((skill, idx) => (
                        <Tooltip
                          key={idx}
                          content={
                            <div className="text-center">
                              <p className="font-semibold">{skill.name}</p>
                              <p className="text-sm text-gray-500">{skill.experience}</p>
                            </div>
                          }
                        >
                          <i className={skill.iconClass}></i>
                        </Tooltip>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
