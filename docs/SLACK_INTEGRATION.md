# Slack Integration Guide

This guide explains how to set up and use Slack integration with Every.news to receive your alerts directly in Slack channels.

## Prerequisites

Before you begin, ensure you have:
- An active Every.news account
- Admin permissions in your Slack workspace (to install apps)
- At least one alert configured in Every.news

## Setting Up Slack Integration

### Step 1: Create a New Slack Channel

1. Navigate to **My Channels** (`/my/channels`) in your Every.news dashboard
2. Click the **Create Channel** button
3. Enter a name for your channel (e.g., "My Slack Alerts")
4. Select **Slack** as the channel type
5. Click **Connect Slack**

### Step 2: Authorize Every.news in Slack

1. You'll be redirected to Slack's OAuth authorization page
2. Select the Slack workspace where you want to receive alerts
3. Review the permissions requested:
   - `channels:read` - View basic channel information
   - `chat:write` - Send messages to channels
   - `chat:write.public` - Send messages to channels without joining
4. Click **Allow** to grant permissions

### Step 3: Select a Slack Channel

1. After authorization, you'll be redirected back to Every.news
2. You'll see a channel selector page showing all available Slack channels
3. Select the Slack channel where you want to receive alerts
4. Click **Save Channel**

### Step 4: Verify the Connection

1. Once saved, you'll see a **Send Test Message** button
2. Click it to send a test message to your selected Slack channel
3. Check your Slack channel for the test message
4. If successful, your Slack integration is ready!

## Managing Slack Channels

### Viewing Channel Status

In your channel list (`/my/channels`), Slack channels display:
- **Connected** ✓ - Channel is properly configured and ready
- **Setup Required** ○ - Need to select a Slack channel
- **Disconnected** ✗ - Connection lost (re-authorization needed)

### Changing the Slack Channel

1. Go to **My Channels** and click on your Slack channel
2. Click **Change Slack Channel**
3. Select a different channel from the dropdown
4. Click **Save Channel**

### Updating Channel Settings

1. Navigate to your Slack channel's edit page
2. You can:
   - Change the channel name (for your reference)
   - Switch to a different Slack channel
   - Send test messages
   - View workspace and channel information

## Connecting Alerts to Slack

### For New Alerts

1. When creating a new alert, select your Slack channel from the delivery options
2. Your alerts will automatically be sent to the configured Slack channel

### For Existing Alerts

1. Edit your existing alert
2. Change the delivery channel to your Slack channel
3. Save the alert

## Alert Format in Slack

Alerts sent to Slack include:
- **Header**: Alert name
- **Summary**: Number of new stories
- **Stories**: Up to 10 stories with:
  - Clickable title linking to the full article
  - Source domain
  - Time since publication
- **Footer**: Powered by Every.news attribution

## Troubleshooting

### "Setup Required" Status
- You haven't selected a Slack channel yet
- Click on the channel and select a Slack channel

### "Disconnected" Status
- Your Slack authorization has expired or been revoked
- Create a new Slack channel to re-authorize

### Not Receiving Alerts
1. Verify the channel status is "Connected"
2. Send a test message to confirm connectivity
3. Check that your alerts are configured to use the Slack channel
4. Ensure the Every.news bot hasn't been removed from your Slack channel

### Permission Errors
- Ensure you have permission to install apps in your Slack workspace
- The selected Slack channel must be accessible to the Every.news bot
- For private channels, you may need to manually add the bot

## Best Practices

1. **Use Descriptive Names**: Name your channels clearly (e.g., "Tech News Slack", "Marketing Alerts Slack")
2. **Test Regularly**: Use the test message feature after any changes
3. **Monitor Status**: Check channel status periodically in your dashboard
4. **Separate Channels**: Consider using different Slack channels for different types of alerts
5. **Archive Unused Channels**: Delete Slack channels you're no longer using to keep your list clean

## Security & Privacy

- Every.news only requests minimal Slack permissions needed for functionality
- Your Slack access token is encrypted and stored securely
- You can revoke access at any time from your Slack workspace settings
- Every.news cannot read messages in your Slack channels
- Only channels where the bot has access will appear in the selector

## Limitations

- Maximum 10 stories displayed per alert (additional stories noted in footer)
- Slack rate limits apply (typically not an issue for normal usage)
- Private channels require manual bot invitation
- One Slack workspace per channel (create multiple channels for multiple workspaces)

## Need Help?

If you encounter any issues with Slack integration:
1. Check this documentation first
2. Try the troubleshooting steps
3. Contact support with:
   - Your channel ID
   - The specific error or issue
   - Screenshots if applicable