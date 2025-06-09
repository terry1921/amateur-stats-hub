// src/ai/flows/team-performance-summary.ts
'use server';

/**
 * @fileOverview Provides a summary of a team's performance, highlighting strengths and weaknesses.
 *
 * - teamPerformanceSummary - A function that generates a team performance summary.
 * - TeamPerformanceSummaryInput - The input type for the teamPerformanceSummary function.
 * - TeamPerformanceSummaryOutput - The return type for the teamPerformanceSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeamPerformanceSummaryInputSchema = z.object({
  teamName: z.string().describe('The name of the team.'),
  matchesPlayed: z.number().describe('The number of matches played by the team.'),
  matchesWon: z.number().describe('The number of matches won by the team.'),
  matchesDrawn: z.number().describe('The number of matches drawn by the team.'),
  matchesLost: z.number().describe('The number of matches lost by the team.'),
  goalsScored: z.number().describe('The total number of goals scored by the team.'),
  goalsConceded: z.number().describe('The total number of goals conceded by the team.'),
  goalDifference: z.number().describe('The goal difference of the team.'),
});

export type TeamPerformanceSummaryInput = z.infer<typeof TeamPerformanceSummaryInputSchema>;

const TeamPerformanceSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the team performance, highlighting strengths and weaknesses.'),
  improvementAreas: z
    .string()!
    .describe('Suggested areas for improvement for the team based on their statistics.'),
});

export type TeamPerformanceSummaryOutput = z.infer<typeof TeamPerformanceSummaryOutputSchema>;

export async function teamPerformanceSummary(input: TeamPerformanceSummaryInput): Promise<TeamPerformanceSummaryOutput> {
  return teamPerformanceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'teamPerformanceSummaryPrompt',
  input: {schema: TeamPerformanceSummaryInputSchema},
  output: {schema: TeamPerformanceSummaryOutputSchema},
  prompt: `You are an expert football analyst providing performance summaries for amateur football teams.

  Based on the provided statistics, create a brief summary of the team's performance, highlighting their strengths and weaknesses. Also, suggest potential areas of improvement for the team.

  Team Name: {{{teamName}}}
  Matches Played: {{{matchesPlayed}}}
  Matches Won: {{{matchesWon}}}
  Matches Drawn: {{{matchesDrawn}}}
  Matches Lost: {{{matchesLost}}}
  Goals Scored: {{{goalsScored}}}
  Goals Conceded: {{{goalsConceded}}}
  Goal Difference: {{{goalDifference}}}

  Summary:
  `, // The AI will fill this in. We are using the schema description to guide the format.
});

const teamPerformanceSummaryFlow = ai.defineFlow(
  {
    name: 'teamPerformanceSummaryFlow',
    inputSchema: TeamPerformanceSummaryInputSchema,
    outputSchema: TeamPerformanceSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
