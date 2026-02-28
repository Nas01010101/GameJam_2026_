using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [SerializeField] private Transform target; // Assign your player transform here
    [SerializeField] private float smoothSpeed = 0.125f; // How smooth the camera follows
    [SerializeField] private Vector3 offset; // Offset from the player

    void LateUpdate()
    {
        if (target == null) return;

        // Desired position is the player's position + offset
        Vector3 desiredPosition = target.position + offset;

        // Smoothly move the camera to the desired position
        Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed);
        transform.position = smoothedPosition;

        // Optional: lock the camera's Z position for 2D
        transform.position = new Vector3(transform.position.x, transform.position.y, -10f);
    }
}