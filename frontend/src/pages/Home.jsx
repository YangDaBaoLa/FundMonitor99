/**
 * 主页面 - 基金监控面板
 */
import { useState, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';

import Header from '../components/layout/Header';
import FundGroup from '../components/watchlist/FundGroup';
import FundDetailDrawer from '../components/fund/FundDetailDrawer';
import AddFundModal from '../components/watchlist/AddFundModal';
import DragPreviewCard from '../components/fund/DragPreviewCard';
import { useFundContext } from '../store/context/FundContext';

function Home() {
  const {
    watchlist,
    groups,
    realtimeData,
    intradayData,
    totalProfit,
    isPolling,
    countdown,
    lastUpdateTime,
    loading,
    addFund,
    removeFund,
    moveFundToGroup,
    createGroup,
    deleteGroup,
    renameGroup,
    isFundAdded,
    getFundsByGroup,
    getGroupProfit,
    getFundFullData,
    refresh,
    hideAmount,
    toggleHideAmount,
    appName,
    updateAppName,
    avatar,
    updateAvatar,
  } = useFundContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 获取正在拖拽的基金数据
  const activeFund = activeDragId 
    ? watchlist.find(f => f.id === activeDragId) 
    : null;

  // 拖拽开始
  const handleDragStart = useCallback((event) => {
    setActiveDragId(event.active.id);
  }, []);

  // 拖拽结束处理
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    setActiveDragId(null);
    
    if (!over) return;
    
    const fundId = active.id;
    const targetGroupId = over.id;
    
    // 检查是否拖到了分组
    const isGroup = groups.some(g => g.id === targetGroupId);
    
    if (isGroup) {
      // 找到当前基金所在的分组
      const currentFund = watchlist.find(f => f.id === fundId);
      if (currentFund && currentFund.groupId !== targetGroupId) {
        moveFundToGroup(fundId, targetGroupId);
      }
    }
  }, [groups, watchlist, moveFundToGroup]);

  // 拖拽取消
  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  // 点击基金名称，打开详情抽屉
  const handleFundNameClick = useCallback((fund) => {
    setSelectedFund(fund);
    setIsDrawerOpen(true);
  }, []);

  // 关闭详情抽屉
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedFund(null);
  }, []);

  // 添加基金
  const handleAddFund = useCallback(async (fund, amount, profit, currentNav) => {
    addFund(fund, amount, profit, currentNav);
  }, [addFund]);

  // 创建新分组
  const handleCreateGroup = useCallback(() => {
    if (newGroupName.trim()) {
      createGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  }, [newGroupName, createGroup]);

  // 删除分组
  const handleDeleteGroup = useCallback((groupId) => {
    if (confirm('确定删除该分组吗？分组内的基金将移回"所有基金"')) {
      deleteGroup(groupId);
    }
  }, [deleteGroup]);

  // 重命名分组
  const handleRenameGroup = useCallback((groupId) => {
    const name = prompt('请输入新的分组名称');
    if (name?.trim()) {
      renameGroup(groupId, name.trim());
    }
  }, [renameGroup]);

  // 删除基金
  const handleDeleteFund = useCallback((fundId) => {
    if (confirm('确定删除该基金吗？')) {
      removeFund(fundId);
    }
  }, [removeFund]);

  return (
    <div className="min-h-screen">
      {/* 头部 */}
      <Header
        totalProfit={totalProfit}
        countdown={countdown}
        isPolling={isPolling}
        lastUpdateTime={lastUpdateTime}
        onRefresh={refresh}
        onAddFund={() => setIsAddModalOpen(true)}
        hideAmount={hideAmount}
        onToggleHideAmount={toggleHideAmount}
        appName={appName}
        onUpdateAppName={updateAppName}
        avatar={avatar}
        onUpdateAvatar={updateAvatar}
      />

      {/* 主内容区 */}
      <main className={`main-content ${isDrawerOpen ? 'blur' : ''}`}>
        <div className="app-container">
          {/* 创建分组按钮 */}
          <div className="flex justify-between items-center mb-lg">
            <h2 className="font-bold text-xl">我的自选基金</h2>
            <div className="flex gap-md">
              {isCreatingGroup ? (
                <div className="flex gap-sm items-center">
                  <input
                    type="text"
                    className="neu-input"
                    placeholder="分组名称"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                    autoFocus
                    style={{ width: 150 }}
                  />
                  <button className="neu-btn" onClick={handleCreateGroup}>
                    确定
                  </button>
                  <button className="neu-btn" onClick={() => setIsCreatingGroup(false)}>
                    取消
                  </button>
                </div>
              ) : (
                <button 
                  className="neu-btn"
                  onClick={() => setIsCreatingGroup(true)}
                >
                  + 新建分组
                </button>
              )}
            </div>
          </div>

          {/* 空状态 */}
          {watchlist.length === 0 && (
            <div className="neu-card text-center p-2xl">
              <div className="text-muted mb-md">还没有添加任何基金</div>
              <button
                className="neu-btn-primary neu-btn"
                onClick={() => setIsAddModalOpen(true)}
              >
                + 添加第一只基金
              </button>
            </div>
          )}

          {/* 分组和基金卡片 */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {groups.map((group) => {
              const groupFunds = getFundsByGroup(group.id);
              const groupProfit = getGroupProfit(group.id);
              
              return (
                <FundGroup
                  key={group.id}
                  group={group}
                  funds={groupFunds}
                  realtimeData={realtimeData}
                  intradayData={intradayData}
                  groupProfit={groupProfit}
                  onFundNameClick={handleFundNameClick}
                  onDeleteFund={handleDeleteFund}
                  onDeleteGroup={handleDeleteGroup}
                  onRenameGroup={handleRenameGroup}
                  activeDragId={activeDragId}
                />
              );
            })}

            {/* 拖拽预览层 - 跟随光标 */}
            <DragOverlay
              dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeFund ? (
                <DragPreviewCard 
                  fund={activeFund} 
                  realtime={realtimeData[activeFund.code]}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {/* 基金详情抽屉 */}
      <FundDetailDrawer
        fund={selectedFund}
        realtime={selectedFund ? realtimeData[selectedFund.code] : null}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        totalAsset={totalProfit?.realtimeTotalAsset || 0}
      />

      {/* 添加基金弹窗 */}
      <AddFundModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddFund}
        isFundAdded={isFundAdded}
      />
    </div>
  );
}

export default Home;
