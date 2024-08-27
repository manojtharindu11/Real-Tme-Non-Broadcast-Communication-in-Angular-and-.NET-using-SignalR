using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace RealTimeDotNet
{
    public class ChatHub : Hub
    {
        // Thread-safe dictionary to store user connections
        private static ConcurrentDictionary<string, string> userConnectionMap = new ConcurrentDictionary<string, string>();

        // Adds a new connection to the dictionary
        private void AddConnection(string userId, string connectionId)
        {
            userConnectionMap[userId] = connectionId;
        }

        // Removes a connection from the dictionary
        private void RemoveConnection(string connectionId)
        {
            var item = userConnectionMap.FirstOrDefault(kvp => kvp.Value == connectionId);
            if (!item.Equals(default(KeyValuePair<string, string>)))
            {
                userConnectionMap.TryRemove(item.Key, out _);
            }
        }

        // Retrieves a connection ID based on user ID
        private string GetConnectionId(string userId)
        {
            userConnectionMap.TryGetValue(userId, out string connectionId);
            return connectionId ?? string.Empty; // Return an empty string if connectionId is null
        }

        // Called when a new client connects
        public override Task OnConnectedAsync()
        {
            var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
            if (!string.IsNullOrEmpty(userId))
            {
                AddConnection(userId, Context.ConnectionId);
                SendActiveUsers(); // Notify all clients of active users
            }

            return base.OnConnectedAsync();
        }

        // Called when a client disconnects
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            RemoveConnection(Context.ConnectionId);
            SendActiveUsers(); // Notify all clients of active users
            await base.OnDisconnectedAsync(exception);
        }

        // Sends a message to a specific user
        public async Task SendMessage(string senderId, string receiverId, string message)
        {
            var connectionId = GetConnectionId(receiverId);
            if (!string.IsNullOrEmpty(connectionId))
            {
                await Clients.Client(connectionId).SendAsync("ReceiveMessage", senderId, message);
            }
        }

        // Sends a list of active users to all clients
        private void SendActiveUsers()
        {
            var activeUserIds = userConnectionMap.Keys.ToList();
            Clients.All.SendAsync("ActiveUsers", activeUserIds);
        }

        // Gets the list of active users, excluding the specified user
        public Task<List<string>> GetActiveUsers()
        {
            var activeUserIds = userConnectionMap.Keys.ToList();
            return Task.FromResult(activeUserIds);
        }
    }
}
