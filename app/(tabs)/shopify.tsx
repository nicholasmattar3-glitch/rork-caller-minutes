import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Globe,
  ExternalLink,
  Settings,
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  Save,
  X,
} from 'lucide-react-native';

interface WebsiteConfig {
  url: string;
  title: string;
  type: 'shopify' | 'website' | 'custom';
}

export default function ShopifyScreen() {
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>({
    url: 'https://shopify.com',
    title: 'My Store',
    type: 'shopify',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(websiteConfig.url);
  const [tempTitle, setTempTitle] = useState(websiteConfig.title);
  const [webViewKey, setWebViewKey] = useState(0);

  const handleSaveSettings = () => {
    if (!tempUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    let formattedUrl = tempUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setWebsiteConfig({
      ...websiteConfig,
      url: formattedUrl,
      title: tempTitle.trim() || 'My Website',
    });
    setWebViewKey(prev => prev + 1); // Force WebView reload
    setShowSettings(false);
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(websiteConfig.url);
  };

  const quickLinks = [
    {
      title: 'Shopify Admin',
      url: 'https://admin.shopify.com',
      icon: <ShoppingCart size={20} color="#96BF47" />,
      description: 'Access your Shopify store admin',
    },
    {
      title: 'Shopify Analytics',
      url: 'https://admin.shopify.com/analytics',
      icon: <BarChart3 size={20} color="#96BF47" />,
      description: 'View store analytics and reports',
    },
    {
      title: 'Customer Management',
      url: 'https://admin.shopify.com/customers',
      icon: <Users size={20} color="#96BF47" />,
      description: 'Manage your customers',
    },
    {
      title: 'Orders',
      url: 'https://admin.shopify.com/orders',
      icon: <Package size={20} color="#96BF47" />,
      description: 'View and manage orders',
    },
  ];

  const handleQuickLink = (url: string, title: string) => {
    setWebsiteConfig({
      ...websiteConfig,
      url,
      title,
    });
    setTempUrl(url);
    setTempTitle(title);
    setWebViewKey(prev => prev + 1);
  };

  if (showSettings) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Website Settings',
            headerRight: () => (
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <X size={24} color="#007AFF" />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView style={styles.settingsContainer} contentContainerStyle={styles.settingsContent}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Website Configuration</Text>
            <Text style={styles.settingsDescription}>
              Configure your website or Shopify store URL to display in the integrated browser.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website Title</Text>
              <TextInput
                style={styles.textInput}
                value={tempTitle}
                onChangeText={setTempTitle}
                placeholder="Enter website title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website URL</Text>
              <TextInput
                style={styles.textInput}
                value={tempUrl}
                onChangeText={setTempUrl}
                placeholder="https://your-store.myshopify.com"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
              <Save size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Quick Links</Text>
            <Text style={styles.settingsDescription}>
              Quickly access common Shopify admin pages or set up your own custom links.
            </Text>

            <View style={styles.quickLinksGrid}>
              {quickLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickLinkCard}
                  onPress={() => handleQuickLink(link.url, link.title)}
                >
                  <View style={styles.quickLinkIcon}>{link.icon}</View>
                  <Text style={styles.quickLinkTitle}>{link.title}</Text>
                  <Text style={styles.quickLinkDescription}>{link.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Premium Feature</Text>
            <View style={styles.premiumInfo}>
              <View style={styles.premiumHeader}>
                <Globe size={24} color="#FFD700" />
                <Text style={styles.premiumTitle}>Integrated Website Browser</Text>
              </View>
              <Text style={styles.premiumDescription}>
                Access your Shopify store, website, or any web-based business tools directly within
                the app. Perfect for managing your online business while staying connected with your
                contacts and call notes.
              </Text>
              <View style={styles.premiumFeatures}>
                <Text style={styles.premiumFeature}>• Full web browser functionality</Text>
                <Text style={styles.premiumFeature}>• Shopify admin integration</Text>
                <Text style={styles.premiumFeature}>• Custom website support</Text>
                <Text style={styles.premiumFeature}>• Quick access links</Text>
                <Text style={styles.premiumFeature}>• Seamless workflow integration</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: websiteConfig.title,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={handleOpenInBrowser}>
                <ExternalLink size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => setShowSettings(true)}>
                <Settings size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {Platform.OS === 'web' ? (
        <View style={styles.iframeContainer}>
          <iframe
            key={webViewKey}
            src={websiteConfig.url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={websiteConfig.title}
          />
        </View>
      ) : (
        <View style={styles.webFallback}>
          <Globe size={48} color="#007AFF" />
          <Text style={styles.webFallbackTitle}>Website Integration</Text>
          <Text style={styles.webFallbackDescription}>
            WebView is not available in Expo Go. Please use a development build or open the website
            in your browser.
          </Text>
          <TouchableOpacity style={styles.openBrowserButton} onPress={handleOpenInBrowser}>
            <ExternalLink size={20} color="#fff" />
            <Text style={styles.openBrowserButtonText}>Open in Browser</Text>
          </TouchableOpacity>

          <View style={styles.quickLinksSection}>
            <Text style={styles.quickLinksTitle}>Quick Access</Text>
            <View style={styles.quickLinksGrid}>
              {quickLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickLinkCard}
                  onPress={() => Linking.openURL(link.url)}
                >
                  <View style={styles.quickLinkIcon}>{link.icon}</View>
                  <Text style={styles.quickLinkTitle}>{link.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  iframeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  webFallbackDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  openBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  openBrowserButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickLinksSection: {
    width: '100%',
    maxWidth: 400,
  },
  quickLinksTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  quickLinkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    maxWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickLinkDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsContent: {
    padding: 16,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  premiumDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  premiumFeatures: {
    gap: 4,
  },
  premiumFeature: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
