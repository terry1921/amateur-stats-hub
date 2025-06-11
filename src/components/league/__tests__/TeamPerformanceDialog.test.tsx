import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TeamPerformanceDialog } from '../TeamPerformanceDialog'; // Adjust path as necessary
import type { TeamStats } from '@/types';
import * as TeamPerformanceSummaryFlow from '@/ai/flows/team-performance-summary'; // To mock the AI flow
import { useToast } from '@/hooks/use-toast';

// Mock the AI flow
jest.mock('@/ai/flows/team-performance-summary', () => ({
  teamPerformanceSummary: jest.fn(),
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


const mockTeam: TeamStats = {
  id: 'team1',
  name: 'Test Team FC',
  played: 10,
  won: 5,
  drawn: 3,
  lost: 2,
  goalsScored: 15,
  goalsConceded: 10,
  goalDifference: 5,
  points: 18,
  leagueId: 'league1',
};

const mockAnalysisResult = {
  summary: 'This is a test summary.',
  improvementAreas: 'These are test areas for improvement.',
};

describe('TeamPerformanceDialog', () => {
  let mockOnClose: jest.Mock;
  let mockTeamPerformanceSummary = TeamPerformanceSummaryFlow.teamPerformanceSummary as jest.Mock;
  let mockToast = jest.fn();

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockTeamPerformanceSummary.mockReset();
    localStorageMock.clear();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it('renders dialog with team name when open', () => {
    render(<TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(`Analisis de rendimiento: ${mockTeam.name}`)).toBeInTheDocument();
  });

  it('does not render dialog when isOpen is false', () => {
    render(<TeamPerformanceDialog team={mockTeam} isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state initially then displays analysis', async () => {
    mockTeamPerformanceSummary.mockResolvedValue(mockAnalysisResult);
    render(<TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Generando analisis.../i)).toBeInTheDocument();
    // expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Assuming Loader2 implies a progressbar role - Removed for now as SVG doesn't have this role by default

    await waitFor(() => {
      expect(screen.getByText(mockAnalysisResult.summary)).toBeInTheDocument();
    });
    expect(screen.getByText(mockAnalysisResult.improvementAreas)).toBeInTheDocument();
    expect(mockTeamPerformanceSummary).toHaveBeenCalledWith({
        teamName: mockTeam.name,
        matchesPlayed: mockTeam.played,
        matchesWon: mockTeam.won,
        matchesDrawn: mockTeam.drawn,
        matchesLost: mockTeam.lost,
        goalsScored: mockTeam.goalsScored,
        goalsConceded: mockTeam.goalsConceded,
        goalDifference: mockTeam.goalDifference,
    });
    // Check if data is cached
    const cacheKey = `teamAnalysisCache_${mockTeam.id}_${mockTeam.played}_${mockTeam.points}`;
    expect(localStorageMock.getItem(cacheKey)).toEqual(JSON.stringify(mockAnalysisResult));
  });

  it('shows error state if analysis fetch fails and allows retry', async () => {
    const errorMessage = 'No se pudo generar el análisis de rendimiento. Inténtelo de nuevo.';
    mockTeamPerformanceSummary.mockRejectedValueOnce(new Error('Fetch failed'));
    render(<TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'Analysis Failed',
    }));

    // Mock successful fetch on retry
    mockTeamPerformanceSummary.mockResolvedValue(mockAnalysisResult);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    expect(screen.getByText(/Generando analisis.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(mockAnalysisResult.summary)).toBeInTheDocument();
    });
    expect(mockTeamPerformanceSummary).toHaveBeenCalledTimes(2); // Initial call + retry
  });

  it('loads analysis from cache if available', async () => {
    const cacheKey = `teamAnalysisCache_${mockTeam.id}_${mockTeam.played}_${mockTeam.points}`;
    localStorageMock.setItem(cacheKey, JSON.stringify(mockAnalysisResult));

    render(<TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(mockAnalysisResult.summary)).toBeInTheDocument();
    });
    expect(screen.getByText(mockAnalysisResult.improvementAreas)).toBeInTheDocument();
    expect(mockTeamPerformanceSummary).not.toHaveBeenCalled(); // Should not call API if cache hit
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Analysis Loaded',
        description: 'Loaded analysis from cache.',
    }));
  });

  it('clears state when dialog is closed and reopened', async () => {
    mockTeamPerformanceSummary.mockResolvedValue(mockAnalysisResult);
    const { rerender } = render(
      <TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(screen.getByText(mockAnalysisResult.summary)).toBeInTheDocument();
    });

    // Close the dialog
    rerender(<TeamPerformanceDialog team={mockTeam} isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(mockAnalysisResult.summary)).not.toBeInTheDocument(); // Content should be cleared

    // Reopen the dialog - should fetch again (or use cache if not cleared by component logic, which it should)
    // Assuming cache is cleared or not used for this specific test's purpose of checking state reset
    localStorageMock.clear(); // Manually clear cache to ensure fresh fetch for this part of test
    mockTeamPerformanceSummary.mockClear(); // Clear mock call count
    mockTeamPerformanceSummary.mockResolvedValueOnce({ ...mockAnalysisResult, summary: "Fresh data" });


    rerender(<TeamPerformanceDialog team={mockTeam} isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Generando analisis.../i)).toBeInTheDocument();
    await waitFor(() => {
        expect(screen.getByText("Fresh data")).toBeInTheDocument();
    });
    expect(mockTeamPerformanceSummary).toHaveBeenCalledTimes(1); // Called again on reopen
  });

   it('does not fetch analysis if team is null', () => {
    render(<TeamPerformanceDialog team={null} isOpen={true} onClose={mockOnClose} />);
    expect(mockTeamPerformanceSummary).not.toHaveBeenCalled();
    // Check for some placeholder or empty state if team is null and dialog is open
    // The component renders a div with h-48 in this case.
    // We can check for the absence of loading, error, or analysis content.
    expect(screen.queryByText(/Generando analisis.../i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No se pudo generar el análisis de rendimiento/i)).not.toBeInTheDocument();
    expect(screen.queryByText(mockAnalysisResult.summary)).not.toBeInTheDocument();
  });

});
