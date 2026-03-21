"use client";

import { useEffect, useState } from "react";
import { Accordion, Tooltip } from "flowbite-react";
import Image from "next/image";
import { AboutMeType, SkillType } from "@/app/types/resume";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { isSafeUrl } from "@/lib/url";

const roles = [
  "Artificial Intelligence",
  "Back-end Development",
  "Cloud Computing",
];

type Props = {
  aboutMe: AboutMeType;
  skills: SkillType[];
};

export default function HomeClient({ aboutMe, skills }: Props) {
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const groupedSkills = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, SkillType[]>,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoleIndex((prevIndex) => (prevIndex + 1) % roles.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex grow flex-col items-center justify-center gap-10 bg-gray-900 px-10 dark:bg-gray-900">
      {/* Profile Image */}
      <div
        className="animate-fade-in-left-top flex w-full flex-col-reverse items-center justify-between gap-3 pt-10 text-center opacity-0 sm:flex-row sm:pt-0 sm:text-start md:gap-6 lg:gap-12 xl:justify-around"
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
            I&apos;m Currently Learning about
          </h1>
          <p className="mb-6 text-2xl font-extrabold leading-tight text-gray-100 md:text-4xl lg:text-6xl dark:text-gray-100">
            <span className="relative">
              <span
                className="animate-fade-in-out  w-full whitespace-nowrap text-blue-500 sm:absolute"
                key={currentRoleIndex}
              >
                {roles[currentRoleIndex]}
              </span>
            </span>
          </p>
        </div>
        {/* Right Section */}
        <div
          className="animate-fade-in-right-top flex flex-col items-center justify-center opacity-0"
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
          {showContactInfo && (
            <div className="animate-fade-in mt-4 text-center opacity-0 lg:mt-6">
              <p className="text-lg font-medium text-gray-200 dark:text-gray-200">
                {aboutMe.name}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-400">
                {aboutMe.email}
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
          {Object.keys(groupedSkills).length === 0 && (
            <p className="col-span-full text-center text-gray-400">No skills to display.</p>
          )}
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
                      className="animate-fade-in-left flex flex-wrap gap-4 opacity-0"
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
                                {skill.proficiency}
                              </p>
                            </div>
                          }
                        >
                          {skill.iconClass ? (
                            <i className={skill.iconClass}></i>
                          ) : skill.iconImage && isSafeUrl(skill.iconImage) ? (
                            <div className="flex size-8 items-center justify-center p-0.5">
                              <Image
                                src={skill.iconImage}
                                alt={skill.name}
                                width={32}
                                height={32}
                                className="size-full object-contain"
                              />
                            </div>
                          ) : null}
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
