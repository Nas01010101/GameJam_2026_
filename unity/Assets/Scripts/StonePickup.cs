using UnityEngine;

public class StonePickup : MonoBehaviour
{
    public EmotionData emotion;

    void Start()
    {
        Destroy(gameObject, 3f);
    }
}