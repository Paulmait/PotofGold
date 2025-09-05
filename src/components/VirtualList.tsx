import React, { useRef, useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ViewToken,
  ListRenderItem,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

interface VirtualListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number;
  numColumns?: number;
  headerComponent?: React.ComponentType<any> | React.ReactElement | null;
  footerComponent?: React.ComponentType<any> | React.ReactElement | null;
  emptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onEndReached?: () => void;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  estimatedItemSize?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  initialNumToRender?: number;
  maintainVisibleContentPosition?: boolean;
  debug?: boolean;
}

interface ViewabilityConfig {
  minimumViewTime: number;
  viewAreaCoveragePercentThreshold: number;
  waitForInteraction: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VirtualList = memo(<T extends any>(props: VirtualListProps<T>) => {
  const {
    data,
    renderItem,
    keyExtractor,
    itemHeight,
    numColumns = 1,
    headerComponent,
    footerComponent,
    emptyComponent,
    onEndReached,
    onRefresh,
    loading = false,
    estimatedItemSize = 50,
    windowSize = 21,
    maxToRenderPerBatch = 10,
    updateCellsBatchingPeriod = 50,
    removeClippedSubviews = true,
    initialNumToRender = 10,
    maintainVisibleContentPosition = false,
    debug = false,
  } = props;

  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Performance optimizations
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      if (itemHeight) {
        return {
          length: itemHeight,
          offset: itemHeight * index,
          index,
        };
      }
      return undefined;
    },
    [itemHeight]
  );

  const viewabilityConfig = useMemo<ViewabilityConfig>(
    () => ({
      minimumViewTime: 100,
      viewAreaCoveragePercentThreshold: 50,
      waitForInteraction: false,
    }),
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const newVisibleItems = new Set(
        viewableItems.map(item => keyExtractor(item.item, item.index!))
      );
      setVisibleItems(newVisibleItems);

      if (debug) {
        console.log(`Visible items: ${newVisibleItems.size}/${data.length}`);
      }
    },
    [keyExtractor, data.length, debug]
  );

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    (info) => {
      const key = keyExtractor(info.item, info.index);
      const isVisible = visibleItems.has(key);

      // Render placeholder for non-visible items to maintain scroll position
      if (!isVisible && Math.abs(info.index * (itemHeight || estimatedItemSize) - scrollOffset) > SCREEN_HEIGHT * 2) {
        return (
          <View style={{ height: itemHeight || estimatedItemSize }}>
            {debug && <Text style={styles.placeholder}>Placeholder {info.index}</Text>}
          </View>
        );
      }

      return renderItem(info);
    },
    [renderItem, keyExtractor, visibleItems, itemHeight, estimatedItemSize, scrollOffset, debug]
  );

  const handleScroll = useCallback((event: any) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  }, []);

  const ListEmptyComponent = useMemo(
    () =>
      emptyComponent || (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items to display</Text>
        </View>
      ),
    [emptyComponent]
  );

  const ListFooterComponent = useMemo(
    () =>
      loading ? (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        footerComponent
      ),
    [loading, footerComponent]
  );

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      numColumns={numColumns}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={removeClippedSubviews}
      initialNumToRender={initialNumToRender}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ) : undefined
      }
      maintainVisibleContentPosition={
        maintainVisibleContentPosition
          ? {
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }
          : undefined
      }
    />
  );
});

VirtualList.displayName = 'VirtualList';

// Optimized Leaderboard Item Component
interface LeaderboardItemProps {
  rank: number;
  playerName: string;
  score: number;
  avatar?: string;
  isCurrentPlayer?: boolean;
  trend?: 'up' | 'down' | 'same';
}

export const LeaderboardItem = memo<LeaderboardItemProps>(
  ({ rank, playerName, score, avatar, isCurrentPlayer, trend }) => {
    const backgroundColor = useMemo(() => {
      if (isCurrentPlayer) return '#FFD700';
      if (rank === 1) return '#FFD700';
      if (rank === 2) return '#C0C0C0';
      if (rank === 3) return '#CD7F32';
      return 'transparent';
    }, [rank, isCurrentPlayer]);

    const trendIcon = useMemo(() => {
      switch (trend) {
        case 'up':
          return '↑';
        case 'down':
          return '↓';
        default:
          return '−';
      }
    }, [trend]);

    return (
      <View style={[styles.leaderboardItem, { backgroundColor }]}>
        <Text style={styles.rank}>#{rank}</Text>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{playerName}</Text>
        </View>
        <Text style={styles.score}>{score.toLocaleString()}</Text>
        <Text style={styles.trend}>{trendIcon}</Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memo optimization
    return (
      prevProps.rank === nextProps.rank &&
      prevProps.playerName === nextProps.playerName &&
      prevProps.score === nextProps.score &&
      prevProps.isCurrentPlayer === nextProps.isCurrentPlayer &&
      prevProps.trend === nextProps.trend
    );
  }
);

LeaderboardItem.displayName = 'LeaderboardItem';

// Optimized Grid Item Component for Collections
interface CollectionGridItemProps {
  item: any;
  index: number;
  onPress: (item: any) => void;
}

export const CollectionGridItem = memo<CollectionGridItemProps>(
  ({ item, index, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(item);
    }, [item, onPress]);

    const opacity = useMemo(() => (item.unlocked ? 1 : 0.5), [item.unlocked]);

    return (
      <View style={[styles.gridItem, { opacity }]}>
        <Text style={styles.gridItemText}>{item.name}</Text>
        {item.count && <Text style={styles.gridItemCount}>x{item.count}</Text>}
      </View>
    );
  }
);

CollectionGridItem.displayName = 'CollectionGridItem';

// Windowed List for extremely large datasets
export const WindowedList = memo(<T extends any>(props: {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  itemHeight: number;
  windowHeight?: number;
}) => {
  const { data, renderItem, itemHeight, windowHeight = SCREEN_HEIGHT } = props;
  const [scrollY, setScrollY] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollY / itemHeight);
    const endIndex = Math.ceil((scrollY + windowHeight) / itemHeight);
    return {
      start: Math.max(0, startIndex - 5), // Buffer
      end: Math.min(data.length, endIndex + 5),
    };
  }, [scrollY, itemHeight, windowHeight, data.length]);

  const visibleItems = useMemo(
    () => data.slice(visibleRange.start, visibleRange.end),
    [data, visibleRange]
  );

  const spacerHeight = useMemo(
    () => visibleRange.start * itemHeight,
    [visibleRange.start, itemHeight]
  );

  return (
    <View style={{ height: windowHeight }}>
      <View style={{ height: spacerHeight }} />
      {visibleItems.map((item, index) =>
        renderItem(item, visibleRange.start + index)
      )}
      <View style={{ height: (data.length - visibleRange.end) * itemHeight }} />
    </View>
  );
});

WindowedList.displayName = 'WindowedList';

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  placeholder: {
    color: '#ccc',
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 50,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 16,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  trend: {
    fontSize: 18,
    width: 20,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridItemCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default VirtualList;