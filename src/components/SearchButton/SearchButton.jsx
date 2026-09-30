import { useAppState } from '../../state/AppState.jsx';
import Button from '../Button/Button.jsx';
import Icon from '../Icon/Icon.jsx';

/** Top bar button that opens the district search palette (also Ctrl/Cmd+K). */
export default function SearchButton() {
  const { openSearch } = useAppState();
  return (
    <Button
      square
      aria-label="Search districts"
      aria-keyshortcuts="Control+K Meta+K"
      title="Search districts (Ctrl+K)"
      onClick={openSearch}
    >
      <Icon name="search" size={16} />
    </Button>
  );
}
