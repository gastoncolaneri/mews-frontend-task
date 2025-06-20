import { FaCalendarAlt } from 'react-icons/fa';
import { StyledReleaseDate } from './ReleaseDate.styles';
import { parseReleaseDate } from '../../utils';

export const ReleaseDate = ({ releaseDate }: { releaseDate: string }) => {
  return (
    <StyledReleaseDate>
      <FaCalendarAlt className="mr-6" />
      {parseReleaseDate(releaseDate)}
    </StyledReleaseDate>
  );
};
