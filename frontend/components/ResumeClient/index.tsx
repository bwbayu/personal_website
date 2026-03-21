"use client";

import { useState } from "react";
import { Tooltip, Timeline, List } from "flowbite-react";
import {
  HiCalendar,
  HiAcademicCap,
  HiBriefcase,
  HiClipboardList,
  HiStar,
} from "react-icons/hi";
import { BsArrowUpRightCircle } from "react-icons/bs";
import "devicon/devicon.min.css";
import Link from "next/link";
import { isSafeUrl } from "@/lib/url";
import {
  EducationType,
  ExperienceType,
  CertificationType,
  AchievementType,
} from "@/app/types/resume";

type Props = {
  educations: EducationType[];
  experiences: ExperienceType[];
  certifications: CertificationType[];
  achievements: AchievementType[];
};

export default function ResumeClient({
  educations,
  experiences,
  certifications,
  achievements,
}: Props) {
  const [activeTab, setActiveTab] = useState("education");

  return (
    <div className="flex grow flex-col bg-gray-900 p-6 dark:bg-gray-900">
      <div className="overflow-x-auto">
        {/* Custom Tabs */}
        <div role="tablist" className="mb-6 flex flex-wrap gap-2 overflow-x-auto border-b">
          {[
            { key: "education", label: "Education", icon: HiAcademicCap },
            { key: "experience", label: "Experience", icon: HiBriefcase },
            {
              key: "certification",
              label: "Certification",
              icon: HiClipboardList,
            },
            { key: "achievement", label: "Achievement", icon: HiStar },
          ].map((tab, idx) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                activeTab === tab.key
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab(tab.key)}
              style={{
                animationDelay: `${idx * 0.2}s`,
                animationFillMode: "forwards",
              }}
            >
              <div className=""></div>
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "education" && (
            <div role="tabpanel" className="px-6">
              {educations.length === 0 && (
                <p className="text-gray-400">No education records to display.</p>
              )}
              {educations.map((education, index) => (
                <Timeline
                  className="animate-fade-in opacity-0"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animationFillMode: "forwards",
                  }}
                  key={index}
                >
                  <Timeline.Item>
                    <Timeline.Point icon={HiCalendar} />
                    <Timeline.Content>
                      <Timeline.Time>
                        {education.startDate} - {education.endDate}
                      </Timeline.Time>
                      <Timeline.Title>{education.title}</Timeline.Title>
                      <Timeline.Body>
                        <p>{education.institution}</p>
                        <p>{education.description}</p>
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                </Timeline>
              ))}
            </div>
          )}

          {activeTab === "experience" && (
            <div role="tabpanel" className="px-6">
              {experiences.length === 0 && (
                <p className="text-gray-400">No experience records to display.</p>
              )}
              {experiences.map((experience, index) => (
                <Timeline
                  className="animate-fade-in opacity-0"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animationFillMode: "forwards",
                  }}
                  key={index}
                >
                  <Timeline.Item key={index}>
                    <Timeline.Point icon={HiCalendar} />
                    <Timeline.Content>
                      <Timeline.Time>
                        {experience.startDate} - {experience.endDate ?? "Present"}
                      </Timeline.Time>
                      <Timeline.Title>{experience.position}</Timeline.Title>
                      <Timeline.Body>
                        <p>{experience.company}</p>
                        <p>{experience.location}</p>
                        <List>
                          {experience.description.map((item, idx) => (
                            <List.Item key={idx}>{item}</List.Item>
                          ))}
                        </List>
                      </Timeline.Body>
                    </Timeline.Content>
                  </Timeline.Item>
                </Timeline>
              ))}
            </div>
          )}

          {activeTab === "certification" && (
            <div role="tabpanel" className="px-6">
              {certifications.length === 0 && (
                <p className="text-gray-400">No certifications to display.</p>
              )}
              {certifications.map((cert, index) => (
                <Timeline
                  className="animate-fade-in opacity-0"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animationFillMode: "forwards",
                  }}
                  key={index}
                >
                  <Timeline.Item key={index}>
                    <Timeline.Point icon={HiCalendar} />
                    <Timeline.Content>
                      <Timeline.Time>{cert.issued}</Timeline.Time>
                      <Timeline.Title>{cert.title}</Timeline.Title>
                      <Timeline.Body>
                        {cert.company_name}
                        <br />
                        {cert.expires && <span>Expires: {cert.expires}</span>}
                      </Timeline.Body>
                      {cert.url && isSafeUrl(cert.url) && (
                        <Tooltip content="View Certificate">
                          <Link
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-3xl text-white hover:text-slate-500"
                          >
                            <BsArrowUpRightCircle />
                          </Link>
                        </Tooltip>
                      )}
                    </Timeline.Content>
                  </Timeline.Item>
                </Timeline>
              ))}
            </div>
          )}

          {activeTab === "achievement" && (
            <div role="tabpanel" className="px-6">
              {achievements.length === 0 && (
                <p className="text-gray-400">No achievements to display.</p>
              )}
              {achievements.map((achievement, index) => (
                <Timeline
                  className="animate-fade-in opacity-0"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animationFillMode: "forwards",
                  }}
                  key={index}
                >
                  <Timeline.Item key={index}>
                    <Timeline.Point icon={HiCalendar} />
                    <Timeline.Content>
                      <Timeline.Time>{achievement.date}</Timeline.Time>
                      <Timeline.Title>{achievement.achievement}</Timeline.Title>
                      <Timeline.Body>
                        <strong>{achievement.event_name}</strong> -{" "}
                        {achievement.org_name}
                        <br />
                        <List>
                          {achievement.descriptions &&
                            achievement.descriptions.map((desc, idx) => (
                              <List.Item key={idx}>{desc}</List.Item>
                            ))}
                        </List>
                      </Timeline.Body>
                      <div className="flex flex-row">
                        {achievement.githubUrl &&
                          achievement.githubUrl.length > 0 && (
                            <div className="flex flex-row">
                              {achievement.githubUrl.filter(isSafeUrl).map((repoUrl, idx) => (
                                <Tooltip content="View Repository" key={idx}>
                                  <Link
                                    href={repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mr-2 text-3xl text-white hover:text-slate-500"
                                  >
                                    <i className="devicon-github-original"></i>
                                  </Link>
                                </Tooltip>
                              ))}
                            </div>
                          )}
                        {achievement.resultUrl &&
                          achievement.resultUrl.filter(isSafeUrl).map((url, idx) => (
                            <Tooltip content="View Certificate" key={idx}>
                              <Link
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mr-2 text-3xl text-white hover:text-slate-500"
                              >
                                <BsArrowUpRightCircle />
                              </Link>
                            </Tooltip>
                          ))}
                      </div>
                    </Timeline.Content>
                  </Timeline.Item>
                </Timeline>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
