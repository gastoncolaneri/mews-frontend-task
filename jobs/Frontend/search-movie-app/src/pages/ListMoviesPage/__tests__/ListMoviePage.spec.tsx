/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { ThemeProvider } from 'styled-components';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailsMoviePage } from '../../DetailsMoviePage/DetailsMoviePage';
import { ListMoviePage } from '../ListMoviePage';
import { useGetListMovies, useGetPopularMovies } from '../../../hooks';
import { listMoviesAdapter } from '../../../adapters/listMoviesAdapter';
import { useInputSearchMovie } from '../../../store';
import { QueryClientWrapper } from '../../../utils/testUtils/QueryClientWrapper';
import { MOCK_LIST_MOVIES_ONE_ITEM, MOCK_LIST_MOVIES_TWO_ITEMS } from '../constants';
import { lightTheme } from '../../../styles/themes';
import type { ListMovie } from '../../../types';
import {
  CARD_LIST_MOVIE_TEST_ID,
  CARD_LIST_MOVIES_SKELETON_TEST_ID,
  CLEAN_INPUT_SEARCH_BUTTON_TEST_ID,
  NO_MOVIES_FOUND_TEST_ID,
  SHOW_MORE_BUTTON_TEST_ID,
  SPINNER_TEST_ID,
} from '../../../constants';

vi.mock('../../../store/inputSearchMovieStore');
vi.mock('../../../hooks/useGetListMovies');
vi.mock('../../../hooks/useGetPopularMovies');
vi.mock('../../../api/fetch/fetchListMovies');
vi.mock('../../../adapters/listMoviesAdapter', () => ({
  listMoviesAdapter: vi.fn(),
}));

type MockUseGetListMoviesParams = {
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  results: ListMovie[];
};

const routes = [
  {
    path: '/',
    element: (
      <ThemeProvider theme={lightTheme}>
        <QueryClientWrapper>
          <ListMoviePage />
        </QueryClientWrapper>
      </ThemeProvider>
    ),
  },
  {
    path: '/details/1',
    element: (
      <ThemeProvider theme={lightTheme}>
        <QueryClientWrapper>
          <DetailsMoviePage />
        </QueryClientWrapper>
      </ThemeProvider>
    ),
  },
];

const router = createMemoryRouter(routes, {
  initialEntries: ['/'],
});

const renderListMovies = () => {
  render(<RouterProvider router={router} />);
};

const mockUseGetListMovies = ({
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  results,
}: MockUseGetListMoviesParams) => {
  return (useGetListMovies as any).mockReturnValue({
    data: {
      pages: [
        {
          page: 1,
          results,
          total_pages: 2,
        },
      ],
    },
    hasNextPage,
    fetchNextPage: vi.fn(),
    isLoading,
    isFetchingNextPage,
    inputSearchDebounced: 'man',
  });
};

const mockUseGetPopularMovies = () => {
  return (useGetPopularMovies as any).mockReturnValue({
    data: {
      pages: [
        {
          page: 1,
          results: MOCK_LIST_MOVIES_ONE_ITEM,
          total_pages: 2,
        },
      ],
    },
    isLoading: false,
  });
};

describe('ListMoviePage', () => {
  beforeEach(() => {
    (useInputSearchMovie as any).mockImplementation((selector: any) =>
      selector({ inputSearchMovie: 'man', setInputSearchMovie: vi.fn() })
    );

    mockUseGetListMovies({
      hasNextPage: true,
      isLoading: false,
      isFetchingNextPage: true,
      results: MOCK_LIST_MOVIES_ONE_ITEM,
    });
    mockUseGetPopularMovies();
    (listMoviesAdapter as any).mockReturnValue(MOCK_LIST_MOVIES_ONE_ITEM);
  });

  it('renders skeletons while loading', () => {
    mockUseGetListMovies({
      hasNextPage: false,
      isLoading: true,
      isFetchingNextPage: false,
      results: MOCK_LIST_MOVIES_ONE_ITEM,
    });
    renderListMovies();

    expect(screen.getAllByTestId(CARD_LIST_MOVIES_SKELETON_TEST_ID)).toHaveLength(8);
  });

  it('renders list movies when data is available', async () => {
    renderListMovies();

    expect(await screen.findByText('Batman')).toBeInTheDocument();
  });

  it('display the "Show more" button if the inputSearchMovie and the hasNextPage are truthy', async () => {
    renderListMovies();

    expect(await screen.findByText('Batman')).toBeInTheDocument();
    expect(screen.queryByTestId(SHOW_MORE_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it('not display the "Show more" button if the hasNextPage is false', async () => {
    mockUseGetListMovies({
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      results: MOCK_LIST_MOVIES_ONE_ITEM,
    });

    renderListMovies();

    expect(await screen.findByText('Batman')).toBeInTheDocument();
    expect(screen.queryByTestId(SHOW_MORE_BUTTON_TEST_ID)).not.toBeInTheDocument();
  });

  it('updates the list movies when the "show more" button is clicked', async () => {
    renderListMovies();

    await waitFor(() => {
      const showMorebutton = screen.getByTestId(SHOW_MORE_BUTTON_TEST_ID);
      expect(showMorebutton).toBeInTheDocument();
      userEvent.click(showMorebutton);
    });

    (listMoviesAdapter as any).mockReturnValue(MOCK_LIST_MOVIES_TWO_ITEMS);
    renderListMovies();

    expect(await screen.findByText('Superman')).toBeInTheDocument();
  });

  it('show spinner when the fetch to show more films is called', async () => {
    renderListMovies();

    await waitFor(() => {
      const showMorebutton = screen.getByTestId(SHOW_MORE_BUTTON_TEST_ID);
      expect(showMorebutton).toBeInTheDocument();
      userEvent.click(showMorebutton);
    });

    const showMorebutton = screen.getByTestId(SPINNER_TEST_ID);

    expect(showMorebutton).toBeInTheDocument();
  });
  it('show a message if no movies are retrieved from the filter', async () => {
    mockUseGetListMovies({
      hasNextPage: false,
      isLoading: false,
      isFetchingNextPage: false,
      results: [],
    });
    (listMoviesAdapter as any).mockReturnValue([]);

    renderListMovies();

    const noMoviesFound = await screen.findByTestId(NO_MOVIES_FOUND_TEST_ID);

    expect(noMoviesFound).toBeInTheDocument();
  });

  it('show clean input search button if input search value exists', async () => {
    renderListMovies();

    const cleanInputSearchButton = screen.getByTestId(CLEAN_INPUT_SEARCH_BUTTON_TEST_ID);

    expect(cleanInputSearchButton).toBeInTheDocument();
  });
  it('not show clean input search button if input search value exists', async () => {
    (useInputSearchMovie as any).mockImplementation((selector: any) =>
      selector({ inputSearchMovie: '', setInputSearchMovie: vi.fn() })
    );

    renderListMovies();

    const cleanInputSearchButton = screen.queryByTestId(CLEAN_INPUT_SEARCH_BUTTON_TEST_ID);

    expect(cleanInputSearchButton).not.toBeInTheDocument();
  });

  it('navigates to details movie page when a card movie is clicked', async () => {
    renderListMovies();

    const movieCard = screen.getByTestId(CARD_LIST_MOVIE_TEST_ID);

    expect(movieCard).toBeInTheDocument();

    await waitFor(() => {
      userEvent.click(movieCard);
      expect(router.state.location.pathname).toBe('/details/1');
    });
  });
});
