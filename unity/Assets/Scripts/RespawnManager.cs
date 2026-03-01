using System.Collections.Generic;
using UnityEngine;

public class RespawnManager : MonoBehaviour
{
    public static RespawnManager Instance;

    public List<RespawnPoint> points =
        new List<RespawnPoint>();

    void Awake()
    {
        Instance = this;
    }

    public RespawnPoint GetFreePoint()
    {
        List<RespawnPoint> freePoints =
            points.FindAll(p => !p.occupied);

        if (freePoints.Count == 0)
        {
            Debug.LogWarning("No free respawn points!");
            return null;
        }

        int rand = Random.Range(0, freePoints.Count);
        return freePoints[rand];
    }

    public void Occupy(RespawnPoint point)
    {
        point.occupied = true;
    }

    public void Release(RespawnPoint point)
    {
        point.occupied = false;
    }
}