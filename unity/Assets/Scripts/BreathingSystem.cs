using UnityEngine;
using System.Collections;

public class BreathingSystem : MonoBehaviour
{
    public GameObject breathingUI;

    public void StartBreathing()
    {
        StartCoroutine(BreathRoutine());
    }

    IEnumerator BreathRoutine()
    {
        breathingUI.SetActive(true);

        float t = 0;

        while (t < 4f)
        {
            t += Time.deltaTime;
            yield return null;
        }

        breathingUI.SetActive(false);
    }
}