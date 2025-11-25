import { TableCell, Box, Typography } from '@mui/material';
import { MoreVert, ExpandLess, ExpandMore } from '@mui/icons-material';
import { SortDirection } from '@/hooks/useSortableTable';

interface SortableHeaderCellProps {
  children: React.ReactNode;
  sortKey?: string;
  onSort?: (key: string) => void;
  currentSortKey?: string;
  currentSortDirection?: SortDirection;
}

export function SortableHeaderCell({
  children,
  sortKey,
  onSort,
  currentSortKey,
  currentSortDirection,
}: SortableHeaderCellProps) {
  const isSorted = sortKey && currentSortKey === sortKey;
  const isClickable = !!sortKey && !!onSort;

  const getSortIcon = () => {
    if (!isSorted) return <MoreVert fontSize="small" sx={{ opacity: 0.3 }} />;
    if (currentSortDirection === 'asc') return <ExpandLess fontSize="small" />;
    if (currentSortDirection === 'desc') return <ExpandMore fontSize="small" />;
    return <MoreVert fontSize="small" sx={{ opacity: 0.3 }} />;
  };

  return (
    <TableCell
      onClick={() => isClickable && onSort(sortKey!)}
      sx={{
        cursor: isClickable ? 'pointer' : 'default',
        userSelect: 'none',
        '&:hover': isClickable ? {
          backgroundColor: 'rgba(129, 199, 132, 0.1)',
        } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography component="span" sx={{ fontWeight: 600 }}>
          {children}
        </Typography>
        {isClickable && getSortIcon()}
      </Box>
    </TableCell>
  );
}
