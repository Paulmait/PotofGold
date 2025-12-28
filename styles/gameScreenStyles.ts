import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const gameScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Sky blue gradient base
  },

  // Background layers
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
    backgroundColor: '#87CEEB',
  },

  landscapeBackground: {
    position: 'absolute',
    bottom: height * 0.15,
    left: 0,
    right: 0,
    height: height * 0.25,
  },

  hillLeft: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    width: width * 0.6,
    height: 150,
    backgroundColor: '#7FD82B',
    borderTopRightRadius: 200,
    transform: [{ skewX: '-15deg' }],
  },

  hillRight: {
    position: 'absolute',
    bottom: 0,
    right: -50,
    width: width * 0.6,
    height: 120,
    backgroundColor: '#8FE53B',
    borderTopLeftRadius: 200,
    transform: [{ skewX: '15deg' }],
  },

  // Railroad track styles
  trackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.15,
    backgroundColor: '#8B6332', // Brown ground color
  },

  railroadTrack: {
    position: 'absolute',
    bottom: height * 0.08,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },

  railTie: {
    width: 8,
    height: 60,
    backgroundColor: '#654321',
    marginHorizontal: 30,
  },

  railLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#696969',
    left: 0,
    right: 0,
  },

  railLineTop: {
    top: 10,
  },

  railLineBottom: {
    bottom: 10,
  },

  // HUD styles
  hudContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1000,
  },

  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
  },

  hudIcon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },

  hudText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  pauseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },

  // Power-up indicators
  powerUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    gap: 10,
  },

  powerUpItem: {
    width: 60,
    height: 60,
    backgroundColor: '#4A5568',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },

  powerUpActive: {
    backgroundColor: '#FFD700',
    opacity: 1,
  },

  powerUpIcon: {
    width: 40,
    height: 40,
  },

  powerUpCount: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  powerUpCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Bottom action buttons
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#3A3458',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  actionButton: {
    width: width / 7,
    height: 60,
    backgroundColor: '#5A4B8B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionButtonIcon: {
    width: 30,
    height: 30,
    marginBottom: 2,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  actionButtonBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Cart styles (keeping existing design)
  cartContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cart: {
    width: 80,
    height: 60,
    backgroundColor: '#8B4513',
    borderRadius: 5,
    borderWidth: 3,
    borderColor: '#654321',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  cartWheels: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },

  wheel: {
    width: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
  },

  cartGold: {
    position: 'absolute',
    top: -10,
    width: 60,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Falling items styles
  fallingItem: {
    position: 'absolute',
    width: 40,
    height: 40,
  },

  coinItem: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
  },

  diamondItem: {
    width: 35,
    height: 35,
    backgroundColor: '#00CED1',
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: '#4682B4',
  },

  starItem: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
  },

  cloverItem: {
    width: 35,
    height: 35,
    backgroundColor: '#228B22',
  },

  bombItem: {
    width: 40,
    height: 40,
    backgroundColor: '#2C2C2C',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Game over overlay
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  gameOverContainer: {
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },

  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },

  gameOverScore: {
    fontSize: 24,
    color: '#666',
    marginBottom: 10,
  },

  gameOverButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },

  gameOverButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
