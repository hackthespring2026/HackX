// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuditShield {
    struct SecurityEvent {
        string eventType;    // e.g., "UNAUTHORIZED_OPEN"
        string eventHash;    // The SHA-256 hash of the video/log data
        uint256 timestamp;   // Millisecond-accurate time
        address reporter;    // Your EC2/Local machine address
    }

    mapping(uint256 => SecurityEvent) public events;
    uint256 public totalEvents;

    event EventAnchored(uint256 indexed id, string eventType, string eventHash);

    // Function to record an anomaly on-chain
    function anchorEvent(string memory _type, string memory _hash) public {
        totalEvents++;
        events[totalEvents] = SecurityEvent(_type, _hash, block.timestamp, msg.sender);
        emit EventAnchored(totalEvents, _type, _hash);
    }
}