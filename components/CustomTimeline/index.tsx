import {
    Button,
    Timeline,
    TimelineBody,
    TimelineContent,
    TimelineItem,
    TimelinePoint,
    TimelineTime,
    TimelineTitle,
  } from "flowbite-react";

type TimelineItemType = {
title?: string;
role?: string;
achievement?: string;
date?: string;
start?: string;
end?: string;
issued?: string;
expires?: string;
description?: string | string[];
url?: string;
};

type TimelineComponentProps = {
data: TimelineItemType[];
};

const CustomTimeline: React.FC<TimelineComponentProps> = ({ data }) => (
<Timeline>
    {data.map((item, index) => (
    <TimelineItem key={index}>
        <TimelinePoint />
        <TimelineContent>
        <TimelineTime>{item.date || `${item.start} - ${item.end}` || `${item.issued} - ${item.expires}`}</TimelineTime>
        <TimelineTitle>{item.title || item.role || item.achievement}</TimelineTitle>
        <TimelineBody>
            {Array.isArray(item.description)
            ? item.description.map((desc, idx) => <p key={idx}>{desc}</p>)
            : <p>{item.description}</p>}
            {item.url && (
            <Button color="gray" href={item.url} target="_blank">
                Learn More
            </Button>
            )}
        </TimelineBody>
        </TimelineContent>
    </TimelineItem>
    ))}
</Timeline>
);

export default CustomTimeline