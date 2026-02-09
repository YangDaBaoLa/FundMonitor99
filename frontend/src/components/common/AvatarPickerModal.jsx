/**
 * 头像选择弹窗
 * 预设10个头像 + 支持上传自定义图片
 * 遵循 Neumorphism 设计系统
 */
import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from 'boring-avatars';
import { X, UploadSimple, Check } from '@phosphor-icons/react';

// 预设头像配置 - 使用不同的名称和变体组合
const PRESET_AVATARS = [
  { id: '1', name: 'Felix', variant: 'beam' },
  { id: '2', name: 'Maria', variant: 'beam' },
  { id: '3', name: 'Jasper', variant: 'marble' },
  { id: '4', name: 'Luna', variant: 'marble' },
  { id: '5', name: 'Oliver', variant: 'pixel' },
  { id: '6', name: 'Sophie', variant: 'pixel' },
  { id: '7', name: 'Atlas', variant: 'sunset' },
  { id: '8', name: 'Iris', variant: 'sunset' },
  { id: '9', name: 'Leo', variant: 'ring' },
  { id: '10', name: 'Nova', variant: 'ring' },
];

// 头像颜色方案 - 使用设计系统的 accent 颜色
const AVATAR_COLORS = ['#6C63FF', '#38B2AC', '#E53E3E', '#ED8936', '#48BB78'];

function AvatarPickerModal({ isOpen, onClose, currentAvatar, onSelect }) {
  const [selectedPreset, setSelectedPreset] = useState(
    currentAvatar?.type === 'preset' ? currentAvatar.value : '1'
  );
  const [customImage, setCustomImage] = useState(
    currentAvatar?.type === 'custom' ? currentAvatar.value : null
  );
  const [isCustomSelected, setIsCustomSelected] = useState(currentAvatar?.type === 'custom');
  const fileInputRef = useRef(null);

  const handlePresetClick = (presetId) => {
    setSelectedPreset(presetId);
    setIsCustomSelected(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    // 读取为 base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setCustomImage(base64);
      setIsCustomSelected(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (isCustomSelected && customImage) {
      onSelect({ type: 'custom', value: customImage });
    } else {
      onSelect({ type: 'preset', value: selectedPreset });
    }
    onClose();
  };

  const getPresetById = (id) => {
    return PRESET_AVATARS.find((p) => p.id === id) || PRESET_AVATARS[0];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* 使用设计系统的 modal-overlay */}
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* 使用设计系统的 modal-content + neu-card 样式 */}
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex justify-between items-center mb-lg">
            <h3>选择头像</h3>
            <button
              onClick={onClose}
              className="neu-btn"
              style={{ padding: '8px', borderRadius: '50%' }}
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* 当前选中预览 */}
          <div className="flex justify-center mb-lg">
            <div className="relative">
              {/* 使用 neu-inset-deep 作为头像容器 */}
              <div 
                className="neu-inset-deep flex items-center justify-center"
                style={{ 
                  width: '88px', 
                  height: '88px', 
                  borderRadius: '50%',
                  padding: '8px'
                }}
              >
                {isCustomSelected && customImage ? (
                  <img
                    src={customImage}
                    alt="自定义头像"
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Avatar
                    size={72}
                    name={getPresetById(selectedPreset).name}
                    variant={getPresetById(selectedPreset).variant}
                    colors={AVATAR_COLORS}
                  />
                )}
              </div>
              {/* 选中指示器 */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-extruded-small)'
                }}
              >
                <Check size={14} weight="bold" color="white" />
              </div>
            </div>
          </div>

          {/* 预设头像网格 */}
          <div className="mb-lg">
            <div className="text-sm text-muted mb-sm">预设头像</div>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: 'var(--space-md)' 
              }}
            >
              {PRESET_AVATARS.map((preset) => (
                <motion.button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'var(--bg-base)',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '6px',
                    cursor: 'pointer',
                    boxShadow: !isCustomSelected && selectedPreset === preset.id
                      ? '0 0 0 3px var(--accent), var(--shadow-extruded-small)'
                      : 'var(--shadow-extruded-small)',
                    transition: 'all 300ms ease-out',
                    outline: 'none'
                  }}
                >
                  <Avatar
                    size={44}
                    name={preset.name}
                    variant={preset.variant}
                    colors={AVATAR_COLORS}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* 自定义上传 */}
          <div className="mb-lg">
            <div className="text-sm text-muted mb-sm">自定义头像</div>
            <div className="flex items-center gap-md">
              {/* 上传按钮 - 使用 neu-inset 样式 */}
              <motion.button
                className="neu-inset flex items-center justify-center gap-sm"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: isCustomSelected && customImage 
                    ? '0 0 0 3px var(--accent), var(--shadow-inset)'
                    : 'var(--shadow-inset)',
                  transition: 'all 300ms ease-out'
                }}
              >
                <UploadSimple size={20} />
                <span className="text-sm">上传图片</span>
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* 已上传预览 */}
              {customImage && (
                <motion.button
                  onClick={() => setIsCustomSelected(true)}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    boxShadow: isCustomSelected 
                      ? '0 0 0 3px var(--accent), var(--shadow-extruded-small)'
                      : 'var(--shadow-extruded-small)',
                    transition: 'all 300ms ease-out'
                  }}
                >
                  <img
                    src={customImage}
                    alt="自定义头像"
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                </motion.button>
              )}
            </div>
            <div 
              className="text-muted mt-sm" 
              style={{ fontSize: '0.75rem' }}
            >
              支持 JPG、PNG 格式，最大 2MB
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-md">
            <button
              onClick={onClose}
              className="neu-btn"
              style={{ flex: 1 }}
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="neu-btn neu-btn-primary"
              style={{ flex: 1 }}
            >
              确认
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default memo(AvatarPickerModal);
