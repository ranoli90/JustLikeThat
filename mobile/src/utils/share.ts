import { Share } from 'react-native';

interface ShareJobParams {
  title: string;
  company: string;
  location: string;
  salary?: string;
  applyUrl: string;
  matchScore?: number;
}

export const shareJob = async (params: ShareJobParams): Promise<void> => {
  const { title, company, location, salary, applyUrl, matchScore } = params;
  
  let message = `Check out this job: ${title} at ${company}\n\n`;
  message += `📍 ${location}\n`;
  
  if (salary) {
    message += `💰 ${salary}\n`;
  }
  
  if (matchScore !== undefined) {
    message += `🎯 ${matchScore}% match\n`;
  }
  
  message += `\n${applyUrl}`;

  await Share.share({
    message,
    title: `Job: ${title}`,
  });
};

export const shareApplicationUpdate = async (company: string, position: string, status: string): Promise<void> => {
  await Share.share({
    message: `Application update: ${position} at ${company} - Status: ${status}`,
    title: 'Application Update',
  });
};
