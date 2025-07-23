import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Coins, Trophy, Wallet, ExternalLink, TrendingUp } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { type VIIFTBalance, type CompletedGoal, type VIIFTTransaction } from "../../shared/schema";
import { WalletConnection } from "./WalletConnection";
import { ClaimRewards } from "./ClaimRewards";
import { useToast } from "../../hooks/use-toast";

interface RewardDashboardProps {
  userId: string;
}

export function RewardDashboard({ userId }: RewardDashboardProps) {
  const { toast } = useToast();
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery<VIIFTBalance>({
    queryKey: ["/api/viift/balance"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/viift/balance");
      return res.json();
    },
  });

  const { data: completedGoals, isLoading: goalsLoading } = useQuery<CompletedGoal[]>({
    queryKey: ["/api/viift/completed-goals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/viift/completed-goals");
      return res.json();
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<VIIFTTransaction[]>({
    queryKey: ["/api/viift/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/viift/transactions");
      return res.json();
    },
  });

  const handleWalletConnected = () => {
    setShowWalletConnection(false);
    refetchBalance();
    toast({
      title: "Wallet Connected",
      description: "Your XRP wallet has been connected successfully!",
    });
  };

  const handleRewardsClaimed = () => {
    setShowClaimModal(false);
    refetchBalance();
    toast({
      title: "Rewards Claimed",
      description: "Your VII-FT tokens have been sent to your wallet!",
    });
  };

  if (balanceLoading || goalsLoading || transactionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.cardTitle}>Total Earned</CardTitle>
            <TrendingUp size={16} color="green" />
          </CardHeader>
          <CardContent>
            <Text style={styles.earnedText}>
              {balance?.totalEarned || 0} VII-FT
            </Text>
            <Text style={styles.mutedText}>
              From {completedGoals?.length || 0} completed goals
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.cardTitle}>Available to Claim</CardTitle>
            <Coins size={16} color="blue" />
          </CardHeader>
          <CardContent>
            <Text style={styles.claimText}>
              {balance?.pendingBalance || 0} VII-FT
            </Text>
            <Text style={styles.mutedText}>
              {balance?.xrpWalletAddress ? 'Ready to claim' : 'Connect wallet to claim'}
            </Text>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.cardTitle}>Total Claimed</CardTitle>
            <Trophy size={16} color="orange" />
          </CardHeader>
          <CardContent>
            <Text style={styles.claimedText}>
              {balance?.totalClaimed || 0} VII-FT
            </Text>
            <Text style={styles.mutedText}>
              Successfully transferred
            </Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.walletCard}>
        <CardHeader>
          <CardTitle style={styles.cardTitle}>
            <Wallet size={20} color="black" />
            <Text>XRP Wallet Connection</Text>
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.walletCardContent}>
          {balance?.xrpWalletAddress ? (
            <View style={styles.walletConnectedContainer}>
              <View style={styles.walletInfoRow}>
                <Text style={styles.mutedText}>Connected Wallet:</Text>
                <Text style={styles.walletAddress}>
                  {balance.xrpWalletAddress.slice(0, 8)}...{balance.xrpWalletAddress.slice(-8)}
                </Text>
              </View>
              <View style={styles.walletInfoRow}>
                <Text style={styles.mutedText}>Trust Line Status:</Text>
                <Badge variant={balance.trustLineSetup ? "secondary" : "destructive"}>
                  {balance.trustLineSetup ? "Active" : "Not Set Up"}
                </Badge>
              </View>
              <View style={styles.buttonGroup}>
                {balance.trustLineSetup && balance.pendingBalance > 0 && (
                  <Button onPress={() => setShowClaimModal(true)} style={styles.claimButton}>
                    <Coins size={16} color="white" />
                    <Text style={styles.buttonText}>Claim {balance.pendingBalance} VII-FT</Text>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onPress={() => setShowWalletConnection(true)}
                  style={styles.changeWalletButton}
                >
                  <Wallet size={16} color="black" />
                  <Text style={styles.buttonText}>Change Wallet</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.walletDisconnectedContainer}>
              <Text style={styles.mutedText}>
                Connect your XRP wallet to claim VII-FT rewards
              </Text>
              <Button onPress={() => setShowWalletConnection(true)} style={styles.connectWalletButton}>
                <Wallet size={16} color="white" />
                <Text style={styles.buttonText}>Connect XRP Wallet</Text>
              </Button>
            </View>
          )}
        </CardContent>
      </Card>

      {completedGoals && completedGoals.length > 0 && (
        <Card style={styles.goalsCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <Trophy size={20} color="black" />
              <Text>Recent Achievements</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.goalsList}>
              {completedGoals.slice(0, 5).map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalDetails}>
                    <Text style={styles.goalMetric}>
                      {goal.metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Text>
                    <Text style={styles.goalValues}>
                      Target: {goal.targetValue} | Achieved: {goal.achievedValue.toFixed(1)}
                    </Text>
                    <Text style={styles.goalDate}>
                      {new Date(goal.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Badge variant="secondary" style={styles.rewardBadge}>
                    <Text style={styles.rewardBadgeText}>+{goal.rewardAmount} VII-FT</Text>
                  </Badge>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      {transactions && transactions.length > 0 && (
        <Card style={styles.transactionsCard}>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.transactionsList}>
              {transactions.slice(0, 10).map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>
                      {tx.type === 'earned' ? 'Reward Earned' : 'Tokens Claimed'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </Text>
                    {tx.txHash && (
                      <TouchableOpacity
                        onPress={() => WebBrowser.openBrowserAsync(`https://xrplorer.com/transaction/${tx.txHash}`)}
                        style={styles.transactionLink}
                      >
                        <Text style={styles.transactionLinkText}>View on XRP Ledger</Text>
                        <ExternalLink size={12} color="blue" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.transactionAmountContainer}>
                    <Text style={tx.type === 'earned' ? styles.amountEarned : styles.amountClaimed}>
                      {tx.type === 'earned' ? '+' : '-'}{tx.amount} VII-FT
                    </Text>
                    <Badge variant={tx.status === 'completed' ? "secondary" : "destructive"}>
                      <Text style={styles.transactionStatusText}>{tx.status}</Text>
                    </Badge>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      <WalletConnection
        isOpen={showWalletConnection}
        onClose={() => setShowWalletConnection(false)}
        onConnected={handleWalletConnected}
      />

      <ClaimRewards
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onClaimed={handleRewardsClaimed}
        pendingBalance={balance?.pendingBalance || 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    width: "32%", // Approx 1/3rd for 3 columns
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  earnedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "green",
  },
  claimText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "blue",
  },
  claimedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "orange",
  },
  mutedText: {
    fontSize: 12,
    color: "gray",
  },
  walletCard: {
    marginBottom: 20,
  },
  walletCardContent: {
    paddingTop: 10,
  },
  walletConnectedContainer: {
    // No specific styles needed, handled by children
  },
  walletInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  walletAddress: {
    fontSize: 14,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  claimButton: {
    flex: 1,
    backgroundColor: "#007BFF",
  },
  changeWalletButton: {
    flex: 1,
    borderColor: "#007BFF",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  walletDisconnectedContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  connectWalletButton: {
    backgroundColor: "#007BFF",
    marginTop: 10,
  },
  goalsCard: {
    marginBottom: 20,
  },
  goalsList: {
    marginTop: 10,
  },
  goalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  goalDetails: {
    flex: 1,
  },
  goalMetric: {
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  goalValues: {
    fontSize: 12,
    color: "gray",
  },
  goalDate: {
    fontSize: 10,
    color: "gray",
  },
  rewardBadge: {
    marginLeft: 10,
    backgroundColor: "#D1FAE5",
  },
  rewardBadgeText: {
    color: "green",
  },
  transactionsCard: {
    marginBottom: 20,
  },
  transactionsList: {
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  transactionDate: {
    fontSize: 12,
    color: "gray",
  },
  transactionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  transactionLinkText: {
    color: "blue",
    textDecorationLine: "underline",
    fontSize: 12,
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
  amountEarned: {
    fontWeight: "bold",
    color: "green",
  },
  amountClaimed: {
    fontWeight: "bold",
    color: "blue",
  },
  transactionStatusText: {
    fontSize: 10,
  },
});
