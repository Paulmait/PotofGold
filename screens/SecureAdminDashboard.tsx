import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { 
  httpsCallable,
  Functions,
} from 'firebase/functions';
import { functions } from '../firebase/firebase';

interface AdminSession {
  adminId: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support' | 'analyst';
  sessionToken: string;
  permissions: string[];
  expiresIn: number;
}

interface UserData {
  id: string;
  profile: {
    username: string;
    email: string;
    avatar?: string;
    country?: string;
  };
  stats: {
    coins: number;
    gems: number;
    level: number;
    highScore: number;
  };
  vipLevel: number;
  createdAt: any;
  lastActive: any;
  banned: boolean;
  violations: number;
}

interface SystemHealth {
  api: {
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  database: {
    reads: number;
    writes: number;
    size: string;
  };
  security: {
    failedLogins: number;
    suspiciousActivity: number;
    activeThreats: number;
  };
}

interface Analytics {
  activeUsers: number;
  newUsers: number;
  revenue: number;
  gamesPlayed: number;
  avgSessionLength: number;
}

export default function SecureAdminDashboard() {
  const [authStage, setAuthStage] = useState<'login' | 'mfa' | 'dashboard'>('login');
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  // MFA state
  const [mfaCode, setMfaCode] = useState('');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaQRCode, setMfaQRCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'security' | 'transactions'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Session timer
  const sessionTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  useEffect(() => {
    if (session) {
      // Set session timeout
      sessionTimer.current = setTimeout(() => {
        Alert.alert('Session Expired', 'Your admin session has expired. Please login again.');
        handleLogout();
      }, session.expiresIn * 1000);
      
      return () => {
        if (sessionTimer.current) {
          clearTimeout(sessionTimer.current);
        }
      };
    }
  }, [session]);

  const checkBiometricSupport = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !isEnrolled) {
      console.log('Biometric authentication not available');
    }
  };

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const adminLoginFn = httpsCallable(functions, 'adminLogin');
      const result = await adminLoginFn({ email, password });
      const data = result.data as any;
      
      if (data.requiresMFA) {
        setTempToken(data.tempToken);
        setAuthStage('mfa');
        
        // Try biometric authentication first
        const biometricSuccess = await authenticateWithBiometrics();
        if (!biometricSuccess) {
          // Fall back to MFA code
          Alert.alert('MFA Required', 'Please enter your 6-digit authentication code');
        }
      } else if (data.success) {
        // No MFA, direct login (should setup MFA)
        setSession({
          adminId: data.adminId,
          role: data.role,
          sessionToken: data.sessionToken,
          permissions: data.permissions,
          expiresIn: data.expiresIn,
        });
        setAuthStage('dashboard');
        await loadDashboardData(data.sessionToken);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access admin dashboard',
        disableDeviceFallback: false,
        cancelLabel: 'Use MFA Code',
      });
      
      if (result.success) {
        // Biometric success counts as MFA verification
        return true;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
    return false;
  };

  const handleMFAVerification = async () => {
    if (mfaCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const verifyMFAFn = httpsCallable(functions, 'verifyAdminMFA');
      const result = await verifyMFAFn({ 
        token: mfaCode,
        tempToken,
      });
      const data = result.data as any;
      
      if (data.success) {
        setSession({
          adminId: data.adminId,
          role: data.role,
          sessionToken: data.sessionToken,
          permissions: data.permissions,
          expiresIn: data.expiresIn,
        });
        setAuthStage('dashboard');
        await loadDashboardData(data.sessionToken);
        
        // Clear MFA code
        setMfaCode('');
      }
    } catch (error: any) {
      Alert.alert('MFA Failed', 'Invalid authentication code');
      setMfaCode('');
    } finally {
      setLoading(false);
    }
  };

  const setupMFA = async () => {
    setLoading(true);
    try {
      const setupMFAFn = httpsCallable(functions, 'setupAdminMFA');
      const result = await setupMFAFn({});
      const data = result.data as any;
      
      setMfaQRCode(data.qrCode);
      setMfaSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setShowMFASetup(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (token: string) => {
    setRefreshing(true);
    try {
      // Load users with proper isolation
      const getUsersFn = httpsCallable(functions, 'getUsers');
      const usersResult = await getUsersFn({ 
        limit: 50,
        filter: {},
        adminToken: token,
      });
      setUsers((usersResult.data as any).users || []);
      
      // Load analytics
      const getAnalyticsFn = httpsCallable(functions, 'getAnalytics');
      const analyticsResult = await getAnalyticsFn({ 
        period: 'day',
        adminToken: token,
      });
      setAnalytics(analyticsResult.data as Analytics);
      
      // Load system health (super admin only)
      if (session?.role === 'super_admin') {
        const getHealthFn = httpsCallable(functions, 'getSystemHealth');
        const healthResult = await getHealthFn({ adminToken: token });
        setSystemHealth(healthResult.data as SystemHealth);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserAction = async (action: string, userId: string, params?: any) => {
    if (!session) return;
    
    setLoading(true);
    try {
      let fn: any;
      let data: any = { 
        userId,
        adminToken: session.sessionToken,
        reason: 'Admin dashboard action',
      };
      
      switch (action) {
        case 'ban':
          fn = httpsCallable(functions, 'banUser');
          data.ban = true;
          data.duration = params?.duration || 86400000; // 24 hours default
          break;
          
        case 'unban':
          fn = httpsCallable(functions, 'banUser');
          data.ban = false;
          break;
          
        case 'modify':
          fn = httpsCallable(functions, 'modifyUser');
          data.updates = params;
          break;
          
        case 'view':
          fn = httpsCallable(functions, 'getUserDetails');
          break;
          
        default:
          throw new Error('Unknown action');
      }
      
      const result = await fn(data);
      
      if (result.data) {
        Alert.alert('Success', `Action completed: ${action}`);
        await loadDashboardData(session.sessionToken);
        setShowUserModal(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (session) {
      try {
        const revokeFn = httpsCallable(functions, 'revokeAdminSession');
        await revokeFn({ 
          sessionId: session.sessionToken,
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setSession(null);
    setAuthStage('login');
    setEmail('');
    setPassword('');
    setMfaCode('');
    setUsers([]);
    setAnalytics(null);
    setSystemHealth(null);
    
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
    }
  };

  const renderLoginScreen = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.authContainer}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460'] as readonly [string, ...string[]]}
        style={styles.authGradient}
      >
        <View style={styles.authCard}>
          <Ionicons name="shield-checkmark" size={60} color="#FFD700" />
          <Text style={styles.authTitle}>Admin Login</Text>
          <Text style={styles.authSubtitle}>Secure Access Portal</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleAdminLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.securityInfo}>
            <Ionicons name="lock-closed" size={16} color="#4CAF50" />
            <Text style={styles.securityText}>256-bit encryption</Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );

  const renderMFAScreen = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.authContainer}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460'] as readonly [string, ...string[]]}
        style={styles.authGradient}
      >
        <View style={styles.authCard}>
          <Ionicons name="key" size={60} color="#FFD700" />
          <Text style={styles.authTitle}>Two-Factor Authentication</Text>
          <Text style={styles.authSubtitle}>Enter your 6-digit code</Text>
          
          <View style={styles.mfaCodeContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={styles.mfaCodeBox}>
                <Text style={styles.mfaCodeText}>
                  {mfaCode[index] || ''}
                </Text>
              </View>
            ))}
          </View>
          
          <TextInput
            style={styles.hiddenInput}
            value={mfaCode}
            onChangeText={(text) => {
              if (text.length <= 6 && /^\d*$/.test(text)) {
                setMfaCode(text);
                if (text.length === 6) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          
          <TouchableOpacity
            style={[styles.loginButton, { opacity: mfaCode.length === 6 ? 1 : 0.5 }]}
            onPress={handleMFAVerification}
            disabled={loading || mfaCode.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setAuthStage('login')}>
            <Text style={styles.backLink}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );

  const renderDashboard = () => (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460'] as readonly [string, ...string[]]}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerRole}>{session?.role?.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'security' && styles.activeTab]}
          onPress={() => setActiveTab('security')}
        >
          <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
            Security
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => session && loadDashboardData(session.sessionToken)}
            tintColor="#FFD700"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
      </ScrollView>
      
      {renderUserModal()}
    </LinearGradient>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {users.filter(u => 
        searchQuery === '' || 
        u.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
      ).map((user) => (
        <TouchableOpacity
          key={user.id}
          style={styles.userCard}
          onPress={() => {
            setSelectedUser(user);
            setShowUserModal(true);
          }}
        >
          <View style={styles.userHeader}>
            <Text style={styles.userName}>{user.profile.username}</Text>
            {user.banned && (
              <View style={styles.bannedBadge}>
                <Text style={styles.bannedText}>BANNED</Text>
              </View>
            )}
            {user.vipLevel > 0 && (
              <View style={styles.vipBadge}>
                <Text style={styles.vipText}>VIP {user.vipLevel}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{user.profile.email}</Text>
          <View style={styles.userStats}>
            <Text style={styles.userStat}>Level {user.stats.level}</Text>
            <Text style={styles.userStat}>💰 {user.stats.coins}</Text>
            <Text style={styles.userStat}>💎 {user.stats.gems}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      {analytics && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.activeUsers}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.newUsers}</Text>
              <Text style={styles.statLabel}>New Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${analytics.revenue.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
          </View>
          
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Session Metrics</Text>
            <Text style={styles.metricText}>
              Average Session: {Math.floor(analytics.avgSessionLength / 60)}m {analytics.avgSessionLength % 60}s
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderSecurityTab = () => (
    <View style={styles.tabContent}>
      {systemHealth && (
        <>
          <View style={styles.securitySection}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthMetric}>
              <Text style={styles.metricLabel}>API Response Time:</Text>
              <Text style={styles.metricValue}>{systemHealth.api.responseTime}ms</Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.metricLabel}>Error Rate:</Text>
              <Text style={[styles.metricValue, { color: systemHealth.api.errorRate > 0.01 ? '#F44336' : '#4CAF50' }]}>
                {(systemHealth.api.errorRate * 100).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.metricLabel}>Database Size:</Text>
              <Text style={styles.metricValue}>{systemHealth.database.size}</Text>
            </View>
          </View>
          
          <View style={styles.securitySection}>
            <Text style={styles.sectionTitle}>Security Alerts</Text>
            <View style={styles.alertCard}>
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={styles.alertText}>
                {systemHealth.security.failedLogins} failed login attempts
              </Text>
            </View>
            <View style={styles.alertCard}>
              <Ionicons name="alert-circle" size={20} color="#F44336" />
              <Text style={styles.alertText}>
                {systemHealth.security.suspiciousActivity} suspicious activities
              </Text>
            </View>
            {systemHealth.security.activeThreats > 0 && (
              <View style={[styles.alertCard, { backgroundColor: 'rgba(244, 67, 54, 0.2)' }]}>
                <Ionicons name="shield" size={20} color="#F44336" />
                <Text style={[styles.alertText, { color: '#F44336' }]}>
                  {systemHealth.security.activeThreats} ACTIVE THREATS
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  const renderTransactionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <Text style={styles.placeholderText}>Transaction history will appear here</Text>
    </View>
  );

  const renderUserModal = () => {
    if (!selectedUser) return null;
    
    return (
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowUserModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>User Details</Text>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>ID:</Text>
              <Text style={styles.detailValue}>{selectedUser.id}</Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Username:</Text>
              <Text style={styles.detailValue}>{selectedUser.profile.username}</Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{selectedUser.profile.email}</Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: selectedUser.banned ? '#F44336' : '#4CAF50' }]}>
                {selectedUser.banned ? 'BANNED' : 'ACTIVE'}
              </Text>
            </View>
            
            <View style={styles.userDetail}>
              <Text style={styles.detailLabel}>Violations:</Text>
              <Text style={styles.detailValue}>{selectedUser.violations}</Text>
            </View>
            
            <View style={styles.modalActions}>
              {selectedUser.banned ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleUserAction('unban', selectedUser.id)}
                >
                  <Text style={styles.actionButtonText}>Unban User</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                  onPress={() => handleUserAction('ban', selectedUser.id)}
                >
                  <Text style={styles.actionButtonText}>Ban User</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                onPress={() => handleUserAction('modify', selectedUser.id, {
                  'stats.coins': selectedUser.stats.coins + 1000
                })}
              >
                <Text style={styles.actionButtonText}>Add 1000 Coins</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Main render
  if (authStage === 'login') {
    return renderLoginScreen();
  } else if (authStage === 'mfa') {
    return renderMFAScreen();
  } else {
    return renderDashboard();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
  },
  authGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 20,
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: 'white',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 50,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  securityText: {
    color: '#4CAF50',
    marginLeft: 5,
    fontSize: 12,
  },
  mfaCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  mfaCodeBox: {
    width: 40,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  mfaCodeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  backLink: {
    color: '#FFD700',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  logoutButton: {
    padding: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFD700',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: 'white',
    fontSize: 16,
  },
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStat: {
    fontSize: 12,
    color: '#FFD700',
  },
  bannedBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 5,
  },
  bannedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  vipBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 5,
  },
  vipText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  analyticsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  metricText: {
    color: 'white',
    fontSize: 14,
  },
  securitySection: {
    marginBottom: 20,
  },
  healthMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricLabel: {
    color: '#999',
    fontSize: 14,
  },
  metricValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  alertText: {
    color: 'white',
    marginLeft: 10,
    flex: 1,
  },
  placeholderText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalClose: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  userDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalActions: {
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});