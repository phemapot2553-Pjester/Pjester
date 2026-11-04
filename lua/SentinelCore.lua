--[[
	SentinelRBX - Client/Server Security & Telemetry Core
	Version: 2.4-Production
	Description: Drop into ServerScriptService to monitor remotes and report exploits.
--]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local Sentinel = {}
local Config = {
	ApiKey = "",
	Endpoint = "http://localhost:3000/api/telemetry",
	AutoBan = true,
	StudioName = "My Roblox Studio"
}

function Sentinel.Init(userConfig)
	for k, v in pairs(userConfig) do
		Config[k] = v
	end
	print("[SentinelRBX] Security Shield initialized for studio:", Config.StudioName)
end

function Sentinel.ReportExploit(player, exploitType, actionTaken)
	task.spawn(function()
		local success, err = pcall(function()
			local payload = {
				apiKey = Config.ApiKey,
				studio = Config.StudioName,
				player = player.Name .. " (" .. player.UserId .. ")",
				type = exploitType,
				action = actionTaken,
				status = Config.AutoBan and "Banned" or "Blocked"
			}

			HttpService:PostAsync(Config.Endpoint, HttpService:JSONEncode(payload), Enum.HttpContentType.ApplicationJson)
		end)

		if not success then
			warn("[SentinelRBX] Failed to report telemetry to backend:", err)
		end
	end)

	if Config.AutoBan then
		player:Kick("[SentinelRBX] Security Violation: " .. exploitType)
	end
end

-- Example RemoteEvent Protection Wrapper
function Sentinel.ProtectRemote(remoteEvent, maxCallsPerSecond)
	local callCounts = {}

	remoteEvent.OnServerEvent:Connect(function(player, ...)
		local userId = player.UserId
		local now = tick()

		callCounts[userId] = callCounts[userId] or { count = 0, resetTime = now + 1 }

		if now > callCounts[userId].resetTime then
			callCounts[userId].count = 0
			callCounts[userId].resetTime = now + 1
		end

		callCounts[userId].count = callCounts[userId].count + 1

		if callCounts[userId].count > (maxCallsPerSecond or 25) then
			Sentinel.ReportExploit(player, "REMOTE_SPAM", "Auto-Blocked & Flagged")
		end
	end)
end

return Sentinel
