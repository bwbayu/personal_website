"use client"

import { useEffect, useState } from "react";
// data
import { getEducationsData } from "@/app/data/educations";
import { getExperiencesData } from "@/app/data/experiences";
import { getCertificationsData } from "@/app/data/certifications";
import { getAchievementsData } from "@/app/data/achievements";
// data type
import { EducationType, ExperienceType, CertificationType, AchievementType } from "../types/resume";
// component
import { Tooltip , Timeline, Tabs, List } from "flowbite-react";
// icon
import { HiCalendar, HiAcademicCap, HiBriefcase, HiClipboardList, HiStar } from "react-icons/hi";
import { BsArrowUpRightCircle } from "react-icons/bs";
import 'devicon/devicon.min.css';
import Link from "next/link";

export default function ResumePage() {
    const [educations, setEducations] = useState<EducationType[]>([]);
    const [experiences, setExperiences] = useState<ExperienceType[]>([]);
    const [certifications, setCertifications] = useState<CertificationType[]>([]);
    const [achievements, setAchievements] = useState<AchievementType[]>([]);

    useEffect(() => {
        async function fetchData() {
          const [eduData, expData, certData, achData] = await Promise.all([
            getEducationsData(),
            getExperiencesData(),
            getCertificationsData(),
            getAchievementsData(),
          ]);
    
          setEducations(eduData);
          setExperiences(expData);
          setCertifications(certData);
          setAchievements(achData);
        }
    
        fetchData();
    }, []);

    return (
        <div className="flex flex-grow flex-col bg-gray-100 p-6 dark:bg-gray-900">
            <div className="overflow-x-auto">
                <Tabs aria-label="Resume Tabs">
                    <Tabs.Item title="Education" icon={HiAcademicCap}>
                    <div className="px-10">
                        <Timeline>
                            {educations.map((education, index) => (
                                <Timeline.Item key={index}>
                                <Timeline.Point icon={HiCalendar} />
                                <Timeline.Content>
                                    <Timeline.Time>
                                    {education.start} - {education.end}
                                    </Timeline.Time>
                                    <Timeline.Title>{education.title}</Timeline.Title>
                                    <Timeline.Body>
                                    <p>{education.institusi}</p>
                                    <p>{education.description}</p>
                                    </Timeline.Body>
                                </Timeline.Content>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                    </Tabs.Item>
                    <Tabs.Item title="Experience" icon={HiBriefcase}>
                    <div className="px-10">
                        <Timeline>
                            {experiences.map((experience, index) => (
                                <Timeline.Item key={index}>
                                <Timeline.Point icon={HiCalendar} />
                                <Timeline.Content>
                                    <Timeline.Time>
                                    {experience.start} - {experience.end} ({experience.duration} months)
                                    </Timeline.Time>
                                    <Timeline.Title>{experience.role}</Timeline.Title>
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
                            ))}
                        </Timeline>
                    </div>
                    </Tabs.Item>
                    <Tabs.Item title="Certification" icon={HiClipboardList}>
                    <div className="px-10">
                        <Timeline>
                            {certifications.map((cert, index) => (
                                <Timeline.Item key={index}>
                                <Timeline.Point icon={HiCalendar} />
                                <Timeline.Content>
                                    <Timeline.Time>{cert.issued}</Timeline.Time>
                                    <Timeline.Title>{cert.title}</Timeline.Title>
                                    <Timeline.Body>
                                    {cert.company}
                                    <br />
                                    {cert.expires && <span>Expires: {cert.expires}</span>}
                                    </Timeline.Body>
                                    {cert.url && (
                                    <Tooltip content="See Certificate">
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
                            ))}
                        </Timeline>
                    </div>
                    </Tabs.Item>
                    <Tabs.Item title="Achievement" icon={HiStar}>
                    <div className="px-10">
                    <Timeline>
                        {achievements.map((achievement, index) => (
                            <Timeline.Item key={index}>
                            <Timeline.Point icon={HiCalendar} />
                            <Timeline.Content>
                                <Timeline.Time>{achievement.date}</Timeline.Time>
                                <Timeline.Title>{achievement.achievement}</Timeline.Title>
                                <Timeline.Body>
                                <strong>{achievement.event}</strong> - {achievement.organization}
                                <br />
                                <List>
                                    {achievement.description && achievement.description.map((desc, idx) => (
                                        <List.Item key={idx}>{desc}</List.Item>
                                    ))}
                                </List>
                                </Timeline.Body>
                                <div className="flex flex-row">
                                    {achievement.repository && achievement.repository.length > 0 && (
                                    <div className="flex flex-row">
                                        {achievement.repository.map((repoUrl, idx) => (
                                        <Tooltip content="See Repository" key={idx}>
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
                                    {achievement.url && (
                                    <Tooltip content="See Certificate">
                                        <Link
                                            href={achievement.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mr-2 text-3xl text-white hover:text-slate-500"
                                        >
                                            <BsArrowUpRightCircle />
                                        </Link>  
                                    </Tooltip>
                                    )}
                                </div>
                            </Timeline.Content>
                            </Timeline.Item>
                        ))}
                        </Timeline>
                    </div>
                    </Tabs.Item>
                </Tabs>
            </div>
        </div>
    )
}