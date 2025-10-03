"use client";

import { useEffect, useState } from "react";
import { Accordion, Tooltip } from "flowbite-react";
import Image from "next/image";
import { getAboutMeData } from "@/public/data/aboutMe";
import { getSkillsData } from "@/public/data/skills";
import { AboutMeType, SkillType } from "@/app/types/resume";
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
  const [groupedSkills, setGroupedSkills] = useState<
    Record<string, SkillType[]>
  >({});
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
        getSkillsData(),
      ]);

      setSelf(selfData);
      setSkills(skillData);

      const grouped = skillData.reduce(
        (acc, skill) => {
          if (!acc[skill.category]) {
            acc[skill.category] = [];
          }
          acc[skill.category].push(skill);
          return acc;
        },
        {} as Record<string, SkillType[]>,
      );

      setGroupedSkills(grouped);
    }

    fetchData();
  }, []);

  return (
    <main className="flex grow flex-col items-center justify-center gap-10 bg-gray-900 px-10 dark:bg-gray-900">
      {/* Profile Image */}
      <div
        className="flex w-full animate-fade-in-left-top flex-col-reverse items-center justify-between gap-3 pt-10 text-center opacity-0 sm:flex-row sm:pt-0 sm:text-start md:gap-6 lg:gap-12 xl:justify-around"
        style={{
          animationDelay: "0.5s",
          animationFillMode: "forwards",
        }}
      >
        {/* Left Section */}
        <div className="items-center">
          <h2 className="mb-4 text-3xl font-bold text-white dark:text-white">
            Hi, I&#39;m Bayu
          </h2>
          <h1 className="mb-6 text-2xl font-extrabold leading-tight text-gray-100 md:text-4xl lg:text-6xl dark:text-gray-100">
            I'm Currently Learning about
          </h1>
          <p className="mb-6 text-2xl font-extrabold leading-tight text-gray-100 md:text-4xl lg:text-6xl dark:text-gray-100">
            <span className="relative">
              <span
                className="w-full  animate-fade-in-out whitespace-nowrap text-blue-500 sm:absolute"
                key={currentRoleIndex}
              >
                {roles[currentRoleIndex]}
              </span>
            </span>
          </p>
        </div>
        {/* Right Section */}
        <div
          className="flex animate-fade-in-right-top flex-col items-center justify-center opacity-0"
          style={{
            animationDelay: "0.5s",
            animationFillMode: "forwards",
          }}
        >
          {/* Profile Picture */}
          <div className="relative size-40 overflow-hidden rounded-full shadow-lg lg:size-60">
            <Image
              src="/bayuwicaksono_bg1.jpeg"
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
                Hide Contact <IoIosArrowUp className="size-4" />
              </>
            ) : (
              <>
                Show Contact <IoIosArrowDown className="size-4" />
              </>
            )}
          </button>

          {/* Contact Information */}
          {showContactInfo && self && (
            <div className="mt-4 animate-fade-in text-center opacity-0 lg:mt-6">
              <p className="text-lg font-medium text-gray-200 dark:text-gray-200">
                {self.name}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                {self.email}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                {self.location}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                {self.phone_number}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 pb-10 sm:pb-0">
        <h2
          className="animate-fade-in text-center text-3xl font-bold text-white opacity-0"
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
                    <div
                      className="flex animate-fade-in-left flex-wrap gap-4 opacity-0"
                      style={{
                        animationDelay: "0.1s",
                        animationFillMode: "forwards",
                      }}
                    >
                      {skills.map((skill, idx) => (
                        <Tooltip
                          key={idx}
                          content={
                            <div className="text-center">
                              <p className="font-semibold">{skill.name}</p>
                              <p className="text-sm text-gray-500">
                                {skill.experience}
                              </p>
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
